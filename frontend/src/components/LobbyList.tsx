import { useQuery } from '@apollo/client';
import React from 'react';
import { Link } from 'react-router-dom';
import {
  GET_LOBBIES,
  SUBSCRIBE_TO_LOBBY_UPDATES,
  updateLobbyFromSubscription,
} from '../gql/LobbyResolver';
import { CoreLobbyFields } from '../gql/types/CoreLobbyFields';
import { LobbyUpdateAction } from '../gql/types/globalTypes';
import { Lobbies, Lobbies_lobbies } from '../gql/types/Lobbies';
import { SubscribeToLobbyUpdates } from '../gql/types/SubscribeToLobbyUpdates';
import Button from './Button';

function LobbyEntry({ lobby }: { lobby: Lobbies_lobbies }) {
  return (
    <div className="bg-slate-50 my-2 p-4 rounded-lg shadow">
      <div className="text-lg">{lobby.players[0].username}&apos;s lobby</div>
      <div className="flex flex-row justify-between">
        <div className="text-slate-500">{lobby.players.length}/4 players</div>
        <Link to={`/lobby/${lobby.id}`}>
          <Button>Join Game</Button>
        </Link>
      </div>
    </div>
  );
}

function LobbyList() {
  const {
    data: lobbies,
    refetch,
    subscribeToMore,
  } = useQuery<Lobbies>(GET_LOBBIES);
  React.useEffect(() => {
    refetch();
    console.log('LobbyList subscribing');
    subscribeToMore<SubscribeToLobbyUpdates>({
      document: SUBSCRIBE_TO_LOBBY_UPDATES,
      updateQuery: (prevGames, { subscriptionData }) => {
        const payload = subscriptionData.data.lobbyUpdate;
        console.log(
          `lobbylist subscription ${payload.lobbyID} ${payload.action}`,
        );
        if (prevGames.lobbies) {
          const { action, lobbyID, player } = subscriptionData.data.lobbyUpdate;
          if (action === LobbyUpdateAction.created) {
            return {
              lobbies: [
                ...prevGames.lobbies,
                {
                  __typename: 'Lobby',
                  id: lobbyID,
                  players: [player],
                  maxPlayers: 4,
                  started: false,
                },
              ],
            };
          }
          const updatedGames = [...prevGames.lobbies]
            .map((g) => updateLobbyFromSubscription(g, { subscriptionData }))
            .filter((g): g is CoreLobbyFields => g !== null);
          return { lobbies: updatedGames };
        }
        console.error(
          'LobbyList.tsx prevGames was nullish, returning',
          prevGames,
        );
        return { lobbies: [] };
      },
    });
    return () => {
      console.log(`lobbylist unmounting (and thus unsubscribing)`);
    };
  }, [refetch, subscribeToMore]);

  if (lobbies === undefined) {
    return <div>Loading lobbies list...</div>;
  }

  if (lobbies.lobbies.length === 0) {
    return (
      <div className="text-slate-500 text-sm mb-2">
        There aren&apos;t any open lobby lobbies, try creating one!
      </div>
    );
  }

  return (
    <ul className="mb-2">
      {lobbies.lobbies.map((lobby) => (
        <li key={lobby.id}>
          <LobbyEntry lobby={lobby} />
        </li>
      ))}
    </ul>
  );
}

export default LobbyList;
