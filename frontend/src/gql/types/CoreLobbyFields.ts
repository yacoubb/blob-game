/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: CoreLobbyFields
// ====================================================

export interface CoreLobbyFields_players {
  __typename: "User";
  id: string;
  username: string;
}

export interface CoreLobbyFields {
  __typename: "Lobby";
  id: string;
  players: CoreLobbyFields_players[];
  maxPlayers: number;
  started: boolean;
}
