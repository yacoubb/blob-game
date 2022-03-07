import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';

import context from './context';
import buildGQL from './buildGQL';

async function main() {
  const app = express();
  const httpServer = createServer(app);
  const schema = await buildGQL();

  // TODO move websocket to other url?
  const subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
    },
    { server: httpServer, path: '/graphql' },
  );

  const apolloServer = new ApolloServer({
    schema,
    context,
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close();
            },
          };
        },
      },
    ],
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  httpServer.listen(4000, () => {
    console.log(
      `Apollo GQL server listening at http://localhost:${4000}/graphql`,
    );
  });
}

main();
