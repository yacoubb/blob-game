import { gql } from '@apollo/client';
import { CORE_USER_FIELDS } from './LobbyResolver';

export const GET_MY_GAME = gql`
  query MyGame {
    myGame {
      id
      port
      serverAddress
      myAccessToken
    }
  }
`;

export const GET_GAME = gql`
  ${CORE_USER_FIELDS}
  query Game($gameID: String!) {
    game(gameID: $gameID) {
      id
      port
      serverAddress
      players {
        ...CoreUserFields
      }
      myAccessToken
    }
  }
`;

export const LEAVE_GAME = gql`
  mutation LeaveGame {
    leaveGame
  }
`;
