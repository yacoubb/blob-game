import {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
  UserInputError,
} from 'apollo-server-core';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import 'reflect-metadata';
import {
  Arg,
  Args,
  Ctx,
  Field,
  Float,
  ID,
  Int,
  Mutation,
  ObjectType,
  Publisher,
  PubSub,
  PubSubEngine,
  Query,
  registerEnumType,
  Resolver,
  Root,
  Subscription,
} from 'type-graphql';
import { Context } from '../context';
import myPubSub from '../myPubSub';
import { User, UserContext } from './AuthResolver';
import { Game, startGame } from './GameResolver';
import getUserTimeoutListener from './UserTimeout';

dotenv.config();

@ObjectType()
export class Lobby {
  @Field(() => ID)
  id: string;

  @Field(() => [User])
  players: User[];

  @Field(() => Int)
  maxPlayers: number;

  @Field(() => Boolean)
  started: boolean;
}

const lobbies: Record<string, Lobby> = {};

const LOBBY_PUBSUB_NAME = 'LOBBY';
enum LobbyUpdateAction {
  'created',
  'removed',
  'started',
  'playerJoined',
  'playerLeft',
  // 'playerTimeout',
}
registerEnumType(LobbyUpdateAction, { name: 'LobbyUpdateAction' });
@ObjectType()
class LobbyUpdate {
  @Field(() => LobbyUpdateAction)
  action: LobbyUpdateAction;

  @Field()
  lobbyID: string;

  @Field(() => User)
  player: User;
}

export type LobbyContext = {
  lobbyID: string | null;
};

export const lobbyContext = (context: UserContext): LobbyContext => {
  // check if user is in a game and inject lobbyID property
  const user = context.me;
  if (user === null) {
    return { lobbyID: null };
  }
  // TODO this is slow, maybe cache user to lobbyID
  const lobbyID = Object.keys(lobbies).find(gId => {
    const lobby = lobbies[gId];
    if (lobby.players.some(u => u.id === user.id)) {
      return true;
    }
    return false;
  });
  if (lobbyID !== undefined) {
    return { lobbyID };
  }
  return { lobbyID: null };
};

const HEARTBEAT_TIMEOUT_MS = parseInt(
  process.env.HEARTBEAT_TIMEOUT_MS || '-1',
  10,
);
if (HEARTBEAT_TIMEOUT_MS === -1) {
  throw new Error('HEARTBEAT_TIMEOUT_MS not present in .env');
}
const lobbyHeartbeatListener = getUserTimeoutListener(HEARTBEAT_TIMEOUT_MS);

const MAX_PLAYERS = parseInt(process.env.MAX_PLAYERS || '-1', 10);
if (MAX_PLAYERS === -1) {
  throw new Error('MAX_PLAYERS not present in .env');
}

@Resolver()
export default class LobbyResolver {
  constructor() {
    lobbyHeartbeatListener.on('timeout', (user: User) => {
      const { lobbyID } = lobbyContext({ me: user });
      if (lobbyID) {
        console.log(
          `LobbyResolver got user ${user.username} timeout, kicking from lobby ${lobbyID}`,
        );
        this.leaveLobby({ lobbyID, me: user, gameID: null }, payload =>
          myPubSub.publish('GAMES', payload),
        );
      }
    });
  }

  @Query(() => Int)
  lobbyHeartbeat(@Ctx() ctx: Context): number {
    if (ctx.me) {
      lobbyHeartbeatListener.emit('heartbeat', ctx.me);
    }
    return HEARTBEAT_TIMEOUT_MS;
  }

  @Query(() => Lobby, { nullable: true })
  myLobby(@Ctx() ctx: Context): Lobby | null {
    if (ctx.lobbyID === null) {
      return null;
    }
    return lobbies[ctx.lobbyID];
  }

  @Query(() => Lobby, { nullable: true })
  lobby(@Arg('lobbyID', () => String) lobbyID: string): Lobby | null {
    if (lobbyID in lobbies) {
      return lobbies[lobbyID];
    }
    return null;
  }

  @Query(() => [Lobby])
  lobbies(): Lobby[] {
    return Object.values(lobbies);
  }

  // subscribe with lobbyID null for all updates
  // subscribe with lobbyID for specific lobby updates
  @Subscription(() => LobbyUpdate, {
    topics: [LOBBY_PUBSUB_NAME],
    filter: ({ args, payload }) =>
      !args.lobbyID || args.lobbyID === payload.lobbyID,
  })
  lobbyUpdate(
    @Root()
    lobbyEvent: LobbyUpdate,
    @Arg('lobbyID', () => String, { nullable: true })
    lobbyID: string | undefined,
  ): LobbyUpdate {
    return lobbyEvent;
  }

  @Mutation(() => Lobby)
  async createLobby(
    @Ctx() ctx: Context,
    @PubSub(LOBBY_PUBSUB_NAME) publish: Publisher<LobbyUpdate>,
  ): Promise<Lobby> {
    if (ctx.me === null) {
      throw new AuthenticationError(`You must be logged in to create a lobby`);
    }
    if (ctx.lobbyID !== null) {
      throw new ForbiddenError(
        `You are already in lobby with id ${ctx.lobbyID}`,
      );
    }
    const newLobby: Lobby = {
      id: nanoid(),
      players: [ctx.me],
      maxPlayers: MAX_PLAYERS,
      started: false,
    };
    lobbies[newLobby.id] = newLobby;
    await publish({
      action: LobbyUpdateAction.created,
      lobbyID: newLobby.id,
      player: ctx.me,
    });
    lobbyHeartbeatListener.emit('heartbeat', ctx.me);

    return newLobby;
  }

  @Mutation(() => Lobby)
  async joinLobby(
    @Ctx() ctx: Context,
    @Arg('lobbyID', () => String) lobbyID: string,
    @PubSub(LOBBY_PUBSUB_NAME) publish: Publisher<LobbyUpdate>,
  ): Promise<Lobby> {
    if (ctx.me === null) {
      throw new AuthenticationError(`You must be logged in to join a lobby`);
    }
    if (ctx.lobbyID === lobbyID) {
      console.warn(`idempotent joinLobby`);
      return lobbies[ctx.lobbyID];
    }
    if (ctx.lobbyID !== null && ctx.lobbyID !== lobbyID) {
      throw new ForbiddenError(
        `You are already in lobby with id ${ctx.lobbyID}`,
      );
    }
    if (!(lobbyID in lobbies)) {
      throw new UserInputError(`Lobby with id ${lobbyID} doesn't exist!`);
    }
    const lobby = lobbies[lobbyID];
    if (lobby.players.length === lobby.maxPlayers) {
      throw new ForbiddenError(`Lobby ${lobbyID} is full`);
    }
    lobby.players.push(ctx.me);
    lobbies[lobby.id] = lobby;
    await publish({
      action: LobbyUpdateAction.playerJoined,
      lobbyID: lobby.id,
      player: ctx.me,
    });
    lobbyHeartbeatListener.emit('heartbeat', ctx.me);

    return lobbies[lobbyID];
  }

  @Mutation(() => Boolean)
  async leaveLobby(
    @Ctx() ctx: Context,
    @PubSub(LOBBY_PUBSUB_NAME) publish: Publisher<LobbyUpdate>,
  ): Promise<boolean> {
    if (ctx.me === null) {
      throw new AuthenticationError(`You must be logged in to leave a game`);
    }
    if (ctx.lobbyID === null) {
      return false;
    }
    // using destructuring because of https://github.com/microsoft/TypeScript/issues/12113
    const { me } = ctx;
    const lobby = lobbies[ctx.lobbyID];
    const players = lobby.players.filter(p => p.id !== me.id);
    if (players.length === lobby.players.length) {
      throw new Error(
        `players.length match after leaving ${players.length} === ${lobby.players.length}`,
      );
    }
    if (players.length === 0) {
      delete lobbies[lobby.id];
      await publish({
        action: LobbyUpdateAction.removed,
        lobbyID: lobby.id,
        player: ctx.me,
      });
    } else {
      lobby.players = players;
      lobbies[lobby.id] = lobby;
      await publish({
        action: LobbyUpdateAction.playerLeft,
        lobbyID: lobby.id,
        player: ctx.me,
      });
    }
    return true;
  }

  @Mutation(() => Game)
  async startLobby(
    @Ctx() ctx: Context,
    @PubSub(LOBBY_PUBSUB_NAME) publish: Publisher<LobbyUpdate>,
  ): Promise<Game> {
    if (ctx.me === null) {
      throw new AuthenticationError(`You must be logged in to start a lobby`);
    }
    if (ctx.lobbyID === null) {
      throw new ForbiddenError(`You must be in a lobby to start it`);
    }
    const lobby = lobbies[ctx.lobbyID];
    // if (lobby.players[0].id !== ctx.me.id) {
    //   throw new ForbiddenError(`You must be the host of this room to start the game`);
    // }
    // lobby started, so we no longer need it
    const game = await startGame(lobby.id, lobby.players);
    await publish({
      action: LobbyUpdateAction.started,
      lobbyID: lobby.id,
      player: ctx.me,
    });
    delete lobbies[lobby.id];
    return game;
  }
}
