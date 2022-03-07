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
import axios from 'axios';
import type {
  NewGamePayload,
  NewGameRequest,
} from '@lobby/gameserver/src/types';
import fs from 'fs';
import path from 'path';
import { Context } from '../context';
import myPubSub from '../myPubSub';
import { User, UserContext } from './AuthResolver';
import getUserTimeoutListener from './UserTimeout';

dotenv.config();

const { GAMESERVER_ADDRESS, GAMESERVER_SECRET } = process.env;
if (GAMESERVER_ADDRESS === undefined || GAMESERVER_SECRET === undefined) {
  throw new Error('backend .env missing properties');
}

const gameserverAddress: string = GAMESERVER_ADDRESS;
const gameserverSecret: string = GAMESERVER_SECRET;

// TODO: remove graphql code from this file
// replace game data stored inside gql with a process manager that spawns game instances on a server
// on createGame request, spawn a new gameServer instance and return the player access tokens + address + port
// replace gameID context with accessToken context
// if we have an accessToken, we are in a game

// this whole file should become much simpler
// we just have a list of game instances
// each instance contains player metadata, address and port
// when a player requests their particular game instance, we return their access token + server address + port

// creating games should then just be a case of creating the above metadata (access tokens + address)
// and spawning a server instance

// lets assume that in the future we will run game instances across many machines, so design the game manager so it can run on a different machine
// probably a simple express server that listens for incoming requests, authenticates them and spawns processes

// need to end the game when everyone leaves or shortly after someone wins OR after some set timeout
// e.g. rules could be:
// games last no longer than 10 mins
// after every player leaves the game will stay alive for 30 seconds before stopping
// the 10 minute timer can be handled using the `timeout` bash command
// the 30 second kill interval can be handled inside unity

@ObjectType()
export class Game {
  @Field(type => String)
  id: string;

  @Field(type => [User])
  players: User[];

  @Field(type => String)
  serverAddress: string;

  @Field(type => Number)
  port: number;

  @Field(type => String, { nullable: true })
  myAccessToken?: string;

  userIdsToAccessTokens: Record<string, string>;
}

const games: Record<string, Game> = {};

setInterval(() => {
  fs.writeFile(
    path.join(__dirname, '../../logs', 'gamelist.log'),
    JSON.stringify(Object.values(games), null, 2),
    () => {
      // written, good
    },
  );
}, 200);

export async function startGame(
  gameID: string,
  players: User[],
): Promise<Game> {
  // TODO check if players are already in a game
  console.log(`startGame(${gameID}, ${players})`);
  const gameRequest: NewGameRequest = {
    players,
    gameID,
  };

  const createdGame: NewGamePayload = (
    await axios.post(`${gameserverAddress}/newgame`, gameRequest, {
      headers: { authorization: `Bearer ${gameserverSecret}` },
    })
  ).data;

  console.log(createdGame);

  const userIdsToAccessTokens: Record<string, string> = {};
  for (const player of createdGame.players) {
    userIdsToAccessTokens[player.id] = player.accessToken;
  }

  const newGame: Game = {
    id: gameID,
    players,
    port: createdGame.port,
    serverAddress: createdGame.serverAddress,
    userIdsToAccessTokens,
  };

  games[newGame.id] = newGame;
  return newGame;
}

export type GameContext = {
  gameID: string | null;
};

export const gameContext = (context: UserContext): GameContext => {
  // check if user is in a game and inject gameID property
  const user = context.me;
  if (user === null) {
    return { gameID: null };
  }
  const gameID = Object.keys(games).find(gId => {
    const game = games[gId];
    if (game.players.some(u => u.id === user.id)) {
      return true;
    }
    return false;
  });
  if (gameID !== undefined) {
    return {
      gameID,
    };
  }
  return { gameID: null };
};

const HEARTBEAT_TIMEOUT_MS = parseInt(
  process.env.HEARTBEAT_TIMEOUT_MS || '-1',
  10,
);
if (HEARTBEAT_TIMEOUT_MS === -1) {
  throw new Error('HEARTBEAT_TIMEOUT_MS not present in .env');
}
const gameHeartbeatListener = getUserTimeoutListener(HEARTBEAT_TIMEOUT_MS);

@Resolver()
export default class GameResolver {
  constructor() {
    gameHeartbeatListener.on('timeout', (user: User) => {
      const { gameID } = gameContext({ me: user });
      if (gameID) {
        console.log(
          `GameResolver got user ${user.username} timeout, kicking from game ${gameID}`,
        );
        this.leaveGame({ gameID, me: user, lobbyID: null });
      }
    });
  }

  @Query(() => Int)
  gameHeartbeat(@Ctx() ctx: Context): number {
    if (ctx.me) {
      gameHeartbeatListener.emit('heartbeat', ctx.me);
    }
    return HEARTBEAT_TIMEOUT_MS;
  }

  @Query(() => Game, { nullable: true })
  myGame(@Ctx() ctx: Context): Game | null {
    if (ctx.gameID === null || ctx.me === null) {
      return null;
    }
    const myGame = games[ctx.gameID];
    return {
      ...myGame,
      myAccessToken: myGame.userIdsToAccessTokens[ctx.me.id],
    };
  }

  @Query(() => Game, { nullable: true })
  game(
    @Ctx() ctx: Context,
    @Arg('gameID', () => String) gameID: string,
  ): Game | null {
    if (gameID in games) {
      if (ctx.me && ctx.gameID === gameID) {
        return {
          ...games[gameID],
          myAccessToken: games[gameID].userIdsToAccessTokens[ctx.me.id],
        };
      }
      return games[gameID];
    }
    return null;
  }

  @Mutation(() => Boolean)
  leaveGame(@Ctx() ctx: Context): boolean {
    if (ctx.me === null) {
      return false;
    }
    if (ctx.gameID === null) {
      return false;
    }
    const { me, gameID } = ctx;
    const game = games[gameID];
    game.players = game.players.filter(p => p.id !== me.id);
    games[game.id] = game;
    if (game.players.length === 0) {
      delete games[game.id];
    }
    return true;
  }
}

// @Mutation(() => Map)
// regenMap(@Ctx() ctx: Context): Map {
//   if (ctx.me === null) {
//     throw new AuthenticationError(
//       `You must be logged in to regenerate a map`,
//     );
//   }
//   if (ctx.lobbyID === null) {
//     throw new ForbiddenError(`You must be in a game to regenerate a map`);
//   }
//   const game = games[ctx.lobbyID];
//   if (game.players[0].id === ctx.me.id) {
//     const newMap = generateMap(Math.max(2, game.players.length));
//     game.map = newMap;
//     games[game.id] = game;
//     // TODO send GQL subscription for game update

//     return newMap;
//   }
//   throw new ForbiddenError(
//     `You must be the host of this room to regenerate a map`,
//   );
// }
