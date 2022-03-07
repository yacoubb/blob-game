import { useLazyQuery } from '@apollo/client';
import React from 'react';
import {
  GET_LOBBY,
  SUBSCRIBE_TO_LOBBY_UPDATES,
  updateLobbyFromSubscription,
} from '../gql/LobbyResolver';
import { Lobby, LobbyVariables } from '../gql/types/Lobby';
import { SubscribeToLobbyUpdates } from '../gql/types/SubscribeToLobbyUpdates';

export default function useLobby(lobbyID: string | undefined) {
  const [fetchLobby, lobbyData] = useLazyQuery<Lobby, LobbyVariables>(
    GET_LOBBY,
  );
  const { subscribeToMore } = lobbyData;
  React.useEffect(() => {
    // apollo subscriptions will clear themselves up on a component unmount
    // but should we consider
    async function fetchAndSub(customLobbyId: string) {
      console.log('fetchAndSub');
      const result = await fetchLobby({
        variables: { lobbyID: customLobbyId },
      });
      if (result.data?.lobby) {
        console.log('useLobby subscribing');
        subscribeToMore<SubscribeToLobbyUpdates>({
          document: SUBSCRIBE_TO_LOBBY_UPDATES,
          variables: { lobbyID: result.data.lobby?.id },
          updateQuery: (prev, { subscriptionData }) => {
            const payload = subscriptionData.data.lobbyUpdate;
            console.log(
              `useLobby subscription ping for lobby ${payload.lobbyID} ${payload.action}`,
            );
            if (prev.lobby) {
              const update = updateLobbyFromSubscription(prev.lobby, {
                subscriptionData,
              });
              return { lobby: update };
            }
            console.log('Lobby.tsx prev was nullish, returning prev');
            return { lobby: null };
          },
        });
      } else {
        console.error('fetchAndSub got null lobby');
      }
    }
    if (lobbyID) {
      fetchAndSub(lobbyID);
    }
  }, [fetchLobby, subscribeToMore, lobbyID]);
  return {
    ...lobbyData,
    lobbyLoading: lobbyData.loading,
    lobby: lobbyData.data,
  };
}
