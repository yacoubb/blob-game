import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import minimist from 'minimist';

import context from './context';
import buildGQL from './buildGQL';
import { writeGamelistToLogfile } from './resolvers/GameResolver';

async function main(port = 4000) {
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

  writeGamelistToLogfile();

  httpServer.listen(port, () => {
    console.log(
      `Apollo GQL server listening at http://localhost:${port}/graphql`,
    );
  });
}

const args = minimist(process.argv.slice(2));

main(args.port);
