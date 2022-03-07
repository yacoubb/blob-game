/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: CreateLobby
// ====================================================

export interface CreateLobby_createLobby_players {
  __typename: "User";
  id: string;
  username: string;
}

export interface CreateLobby_createLobby {
  __typename: "Lobby";
  id: string;
  players: CreateLobby_createLobby_players[];
  maxPlayers: number;
  started: boolean;
}

export interface CreateLobby {
  createLobby: CreateLobby_createLobby;
}
