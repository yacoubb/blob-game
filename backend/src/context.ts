import { ExpressContext } from 'apollo-server-express';
import { ContextFunction } from 'apollo-server-core';
import { userContext, UserContext } from './resolvers/AuthResolver';
import { lobbyContext, LobbyContext } from './resolvers/LobbyResolver';
import { gameContext, GameContext } from './resolvers/GameResolver';

console.log('context.ts');
export type Context = UserContext & LobbyContext & GameContext;

const context: ContextFunction<ExpressContext, Context> = args => {
  const user = userContext(args);
  const lobby = lobbyContext(user);
  const game = gameContext(user);
  if (args.req.body.operationName !== 'IntrospectionQuery') {
    console.log(
      `context query: ${args.req.body.operationName} user: ${user.me?.username}, lobby: ${lobby.lobbyID}, game: ${game.gameID}`,
    );
  }
  return { ...user, ...lobby, ...game };
};

export default context;
