import { useQuery } from '@apollo/client';
import React from 'react';
import { GET_MY_LOBBY } from '../gql/LobbyResolver';
import { MyLobby } from '../gql/types/MyLobby';

export default function useMyGame() {
  const {
    data: myLobby,
    loading: myLobbyLoading,
    refetch: myLobbyRefetch,
    ...rest
  } = useQuery<MyLobby>(GET_MY_LOBBY, { fetchPolicy: 'network-only' });

  return { myLobby, myLobbyLoading, myLobbyRefetch, ...rest };
}
