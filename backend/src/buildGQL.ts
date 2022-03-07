import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import myPubSub from './myPubSub';
import { AuthResolver, LobbyResolver, GameResolver } from './resolvers';

export default async function genSchema() {
  const schema = await buildSchema({
    resolvers: [AuthResolver, LobbyResolver, GameResolver],
    validate: false,
    emitSchemaFile: './schema.gql',
    pubSub: myPubSub,
  });

  return schema;
}

genSchema();
