import { useApolloClient, useMutation, useSubscription } from '@apollo/client';
import React, { useEffect } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { BsFillPersonFill } from 'react-icons/bs';
import Button from '../components/Button';
import NavBar from '../components/NavBar';
import PaddedContainer from '../components/PaddedContainer';
import { useAuth, useLobby, useMyLobby, useHeartbeat } from '../hooks';
import GameNotFound from '../components/GameNotFound';
import { Lobby_lobby_players } from '../gql/types/Lobby';
import { JoinLobby, JoinLobbyVariables } from '../gql/types/JoinLobby';
import {
  JOIN_LOBBY,
  LEAVE_LOBBY,
  START_LOBBY,
  SUBSCRIBE_TO_LOBBY_UPDATES,
} from '../gql/LobbyResolver';
import { StartLobby } from '../gql/types/StartLobby';
import { LeaveLobby } from '../gql/types/LeaveLobby';
import {
  SubscribeToLobbyUpdates,
  SubscribeToLobbyUpdatesVariables,
} from '../gql/types/SubscribeToLobbyUpdates';
import { LobbyUpdateAction } from '../gql/types/globalTypes';

function PlayerCard({ player }: { player: Lobby_lobby_players }) {
  const { user } = useAuth();
  return (
    <div className="bg-slate-50 rounded-md shadow-md mb-4 p-2 flex flex-row justify-between">
      {player.username}
      {user?.id === player.id && <BsFillPersonFill />}
    </div>
  );
}

function Lobby() {
  const { lobbyID } = useParams();
  if (!lobbyID) throw new Error(`Lobby.tsx lobbyID param missing`);

  const { lobbyLoading, lobby } = useLobby(lobbyID);
  const { myLobby, myLobbyLoading } = useMyLobby();

  const navigate = useNavigate();

  const [joinLobby] = useMutation<JoinLobby, JoinLobbyVariables>(JOIN_LOBBY);
  const [startLobby] = useMutation<StartLobby>(START_LOBBY);
  const [leaveLobby] = useMutation<LeaveLobby>(LEAVE_LOBBY);
  const leaveLobbyCallback = React.useCallback(async () => {
    const result = await leaveLobby();
    console.log('leaveLobby finished');
    if (result.data?.leaveLobby) {
      navigate(`/`);
    }
  }, [navigate, leaveLobby]);

  useHeartbeat('lobby');

  useEffect(() => {
    if (!lobbyLoading && !myLobbyLoading) {
      if (lobby?.lobby?.id && lobby?.lobby?.id !== myLobby?.myLobby?.id) {
        console.log('joinLobby called');
        joinLobby({ variables: { lobbyID: lobby.lobby.id } });
      }
    }
  }, [
    lobby?.lobby?.id,
    lobbyLoading,
    myLobby?.myLobby?.id,
    myLobbyLoading,
    joinLobby,
  ]);

  useSubscription<SubscribeToLobbyUpdates, SubscribeToLobbyUpdatesVariables>(
    SUBSCRIBE_TO_LOBBY_UPDATES,
    {
      variables: { lobbyID },
      onSubscriptionData: ({ subscriptionData }) => {
        const update = subscriptionData.data?.lobbyUpdate;
        if (update) {
          if (update.action === LobbyUpdateAction.started) {
            // navigate to the started lobby
            navigate(`/game/${update.lobbyID}`);
          }
        }
      },
    },
  );
  // const startLobbyCallback = React.useCallback(async () => {
  //   const result = await startLobby();
  //   console.log(result.data);
  //   if (result.data?.startLobby) {
  //     navigate(`/game/${result.data.startLobby.id}`);
  //   }
  // }, [navigate, startLobby]);

  if (lobbyLoading) {
    return (
      <PaddedContainer>
        <NavBar />
      </PaddedContainer>
    );
  }
  if (!lobby?.lobby) {
    return <GameNotFound gameId={lobbyID} title="Lobby" />;
  }
  // TODO add started back
  if (!lobby?.lobby?.started) {
    return (
      <PaddedContainer>
        <h1 className="text-3xl mb-4">
          {lobby.lobby.players[0].username}&apos;s lobby
        </h1>
        <div>
          <h3 className="text-lg">
            Players ({lobby.lobby.players.length} / {lobby.lobby.maxPlayers}):
          </h3>
          {lobby.lobby.players.map((player) => (
            <React.Fragment key={player.id}>
              <PlayerCard player={player} />
            </React.Fragment>
          ))}
        </div>
        <div className="flex flex-row justify-between">
          <Button
            color="green"
            // disabled={!lobby?.lobby || lobby.lobby.players.length < 2}
            onClick={() => startLobby()}
          >
            Start lobby
          </Button>
          <Button color="red" onClick={leaveLobbyCallback}>
            Leave lobby
          </Button>
        </div>
      </PaddedContainer>
    );
  }
  return <Navigate to={`/game/${lobby.lobby.id}`} />;
}

export default Lobby;
