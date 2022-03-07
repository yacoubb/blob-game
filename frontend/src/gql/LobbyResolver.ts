import { gql } from '@apollo/client';
import { CoreLobbyFields } from './types/CoreLobbyFields';
import { LobbyUpdateAction } from './types/globalTypes';
import { SubscribeToLobbyUpdates } from './types/SubscribeToLobbyUpdates';

// Using fragments doesnt seem to generate consistent types, but we are guaranteed for types to match so i guess it doesnt matter

export const CORE_USER_FIELDS = gql`
  fragment CoreUserFields on User {
    id
    username
  }
`;

const CORE_LOBBY_FIELDS = gql`
  ${CORE_USER_FIELDS}
  fragment CoreLobbyFields on Lobby {
    id
    players {
      ...CoreUserFields
    }
    maxPlayers
    started
  }
`;

export const GET_LOBBIES = gql`
  ${CORE_LOBBY_FIELDS}
  query Lobbies {
    lobbies {
      ...CoreLobbyFields
    }
  }
`;

export const GET_LOBBY = gql`
  ${CORE_LOBBY_FIELDS}
  query Lobby($lobbyID: String!) {
    lobby(lobbyID: $lobbyID) {
      ...CoreLobbyFields
    }
  }
`;

export const GET_MY_LOBBY = gql`
  ${CORE_LOBBY_FIELDS}
  query MyLobby {
    myLobby {
      ...CoreLobbyFields
    }
  }
`;

// sub with lobbyID = null for all updates, set ID for specific updates
export const SUBSCRIBE_TO_LOBBY_UPDATES = gql`
  ${CORE_USER_FIELDS}
  subscription SubscribeToLobbyUpdates($lobbyID: String) {
    lobbyUpdate(lobbyID: $lobbyID) {
      action
      lobbyID
      player {
        ...CoreUserFields
      }
    }
  }
`;

export const CREATE_LOBBY = gql`
  ${CORE_LOBBY_FIELDS}
  mutation CreateLobby {
    createLobby {
      ...CoreLobbyFields
    }
  }
`;

export const JOIN_LOBBY = gql`
  mutation JoinLobby($lobbyID: String!) {
    joinLobby(lobbyID: $lobbyID) {
      id
    }
  }
`;

export const LEAVE_LOBBY = gql`
  mutation LeaveLobby {
    leaveLobby
  }
`;

export const HEARTBEAT = gql`
  query Heartbeat {
    heartbeat
  }
`;

export const START_LOBBY = gql`
  mutation StartLobby {
    startLobby {
      id
    }
  }
`;

export const updateLobbyFromSubscription = (
  prev: CoreLobbyFields,
  { subscriptionData }: { subscriptionData: { data: SubscribeToLobbyUpdates } },
): CoreLobbyFields | null => {
  const { action, lobbyID, player } = subscriptionData.data.lobbyUpdate;
  console.log(`updateLobbyFromSubscription`, lobbyID, action);
  if (prev.id === lobbyID) {
    switch (action) {
      case LobbyUpdateAction.created:
        throw new Error(
          'Game created event not handled by updateLobbyFromSubscription!',
        );
      case LobbyUpdateAction.removed:
        return null;
      case LobbyUpdateAction.started:
        return null;
      case LobbyUpdateAction.playerJoined:
        return { ...prev, players: [...prev.players, player] };
      case LobbyUpdateAction.playerLeft:
        return {
          ...prev,
          players: prev.players.filter((p) => p.id !== player.id),
        };
      default:
        throw new Error(`Unknown updateLobby subscription event ${action}`);
    }
  }
  return prev;
};
