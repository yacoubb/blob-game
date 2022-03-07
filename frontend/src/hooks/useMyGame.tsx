import { useQuery } from '@apollo/client';
import React from 'react';
import { GET_MY_GAME } from '../gql/GameResolver';
import { MyGame } from '../gql/types/MyGame';

export default function useMyGame() {
  const {
    data: myGame,
    loading: myGameLoading,
    refetch: myGameRefetch,
    ...rest
  } = useQuery<MyGame>(GET_MY_GAME, { fetchPolicy: 'network-only' });

  return { myGame, myGameLoading, myGameRefetch, ...rest };
}
