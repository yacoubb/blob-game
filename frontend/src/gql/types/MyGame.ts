/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: MyGame
// ====================================================

export interface MyGame_myGame {
  __typename: "Game";
  id: string;
  port: number;
  serverAddress: string;
  myAccessToken: string | null;
}

export interface MyGame {
  myGame: MyGame_myGame | null;
}
