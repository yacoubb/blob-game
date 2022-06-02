import { gql, useQuery } from '@apollo/client';
import React from 'react';

export default function useHeartbeat(
  type: 'lobby' | 'game',
  intervalMs = 5000,
) {
  const queryString = `
  query ${type.toUpperCase()}Heartbeat {
    ${type}Heartbeat
  }
`;
  const query = gql(queryString);
  useQuery(query, {
    fetchPolicy: 'network-only',
    pollInterval: intervalMs,
  });
}
