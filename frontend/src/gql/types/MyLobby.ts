/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: MyLobby
// ====================================================

export interface MyLobby_myLobby_players {
  __typename: "User";
  id: string;
  username: string;
}

export interface MyLobby_myLobby {
  __typename: "Lobby";
  id: string;
  players: MyLobby_myLobby_players[];
  maxPlayers: number;
  started: boolean;
}

export interface MyLobby {
  myLobby: MyLobby_myLobby | null;
}
