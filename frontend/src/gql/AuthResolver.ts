import { gql } from '@apollo/client';

export const GET_ME = gql`
  query GetMe {
    me {
      id
      username
    }
  }
`;

export const REGISTER_USERNAME = gql`
  mutation RegisterUsername($username: String!) {
    register(username: $username)
  }
`;
