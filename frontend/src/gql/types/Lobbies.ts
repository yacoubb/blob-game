/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Lobbies
// ====================================================

export interface Lobbies_lobbies_players {
  __typename: "User";
  id: string;
  username: string;
}

export interface Lobbies_lobbies {
  __typename: "Lobby";
  id: string;
  players: Lobbies_lobbies_players[];
  maxPlayers: number;
  started: boolean;
}

export interface Lobbies {
  lobbies: Lobbies_lobbies[];
}
