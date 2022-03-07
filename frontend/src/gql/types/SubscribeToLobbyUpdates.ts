/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LobbyUpdateAction } from "./globalTypes";

// ====================================================
// GraphQL subscription operation: SubscribeToLobbyUpdates
// ====================================================

export interface SubscribeToLobbyUpdates_lobbyUpdate_player {
  __typename: "User";
  id: string;
  username: string;
}

export interface SubscribeToLobbyUpdates_lobbyUpdate {
  __typename: "LobbyUpdate";
  action: LobbyUpdateAction;
  lobbyID: string;
  player: SubscribeToLobbyUpdates_lobbyUpdate_player;
}

export interface SubscribeToLobbyUpdates {
  lobbyUpdate: SubscribeToLobbyUpdates_lobbyUpdate;
}

export interface SubscribeToLobbyUpdatesVariables {
  lobbyID?: string | null;
}
