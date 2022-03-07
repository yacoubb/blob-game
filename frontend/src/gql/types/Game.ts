/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Game
// ====================================================

export interface Game_game_players {
  __typename: "User";
  id: string;
  username: string;
}

export interface Game_game {
  __typename: "Game";
  id: string;
  port: number;
  serverAddress: string;
  players: Game_game_players[];
  myAccessToken: string | null;
}

export interface Game {
  game: Game_game | null;
}

export interface GameVariables {
  gameID: string;
}
