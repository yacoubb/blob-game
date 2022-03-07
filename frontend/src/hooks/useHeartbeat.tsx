import { gql, useQuery } from '@apollo/client';
import React from 'react';

export default function useHeartbeat(type: 'lobby' | 'game') {
  useQuery(
    gql`
      query ${type.toUpperCase()}Heartbeat {
        ${type}Heartbeat
      }
    `,
    {
      fetchPolicy: 'network-only',
      pollInterval: 5000,
    },
  );
}
