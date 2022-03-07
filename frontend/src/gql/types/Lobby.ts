/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Lobby
// ====================================================

export interface Lobby_lobby_players {
  __typename: "User";
  id: string;
  username: string;
}

export interface Lobby_lobby {
  __typename: "Lobby";
  id: string;
  players: Lobby_lobby_players[];
  maxPlayers: number;
  started: boolean;
}

export interface Lobby {
  lobby: Lobby_lobby | null;
}

export interface LobbyVariables {
  lobbyID: string;
}
