import React, { FC } from 'react';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
  from,
  split,
} from '@apollo/client';
import { WebSocketLink } from '@apollo/client/link/ws';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { getMainDefinition } from '@apollo/client/utilities';
import { AUTH_TOKEN } from './AuthProvider';

const { REACT_APP_NODE_ENV } = process.env;
console.log(REACT_APP_NODE_ENV);
const backendAddressDict = {
  development: 'localhost:4000/graphql',
  staging: 'localhost:4000/graphql',
  production: 'gameserver:4000/graphql',
};

if (!REACT_APP_NODE_ENV || !(REACT_APP_NODE_ENV in backendAddressDict)) {
  throw new Error(`Unknown REACT_APP_NODE_ENV ${REACT_APP_NODE_ENV}`);
}

const BACKEND_URL =
  backendAddressDict[REACT_APP_NODE_ENV as keyof typeof backendAddressDict];

if (REACT_APP_NODE_ENV === 'production')
  throw new Error(`Update frontend with proper production IP`);

const httpLink = createHttpLink({ uri: `http://${BACKEND_URL}` });
const wsLink = new WebSocketLink({
  uri: `ws://${BACKEND_URL}`,
  options: {
    reconnect: true,
  },
});
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    console.log('graphQLErrors', graphQLErrors);
  }
  if (networkError) {
    console.log('networkError', networkError);
  }
});
const authLink = setContext((_, context) => {
  const token = localStorage.getItem(AUTH_TOKEN);
  return {
    ...context,
    headers: {
      ...context.headers,
      authorization: token,
    },
  };
});

const allLinks = from([authLink, errorLink, splitLink]);
const cache = new InMemoryCache();

const client = new ApolloClient({
  link: allLinks,
  cache,
});

const MyApolloProvider: FC = ({ children }) => {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

export default MyApolloProvider;
