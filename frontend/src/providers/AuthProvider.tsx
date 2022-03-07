import { useApolloClient, useQuery } from '@apollo/client';
import React from 'react';
import { GET_ME, REGISTER_USERNAME } from '../gql/AuthResolver';
import { GetMe, GetMe_me } from '../gql/types/GetMe';
import {
  RegisterUsername,
  RegisterUsernameVariables,
} from '../gql/types/RegisterUsername';

type AuthContextType = {
  user: GetMe_me | null;
  registerUsername: (username: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  registerUsername: (username) => {
    throw new Error(`registerUsername(${username}) not initialised`);
  },
  logout: () => {
    throw new Error(`Logout not initialised`);
  },
});

export const AUTH_TOKEN = 'token';

const AuthProvider: React.FC = ({ children }) => {
  const client = useApolloClient();
  const { data, refetch } = useQuery<GetMe>(GET_ME, {
    pollInterval: 8 * 1000,
  });

  const registerUsername = React.useCallback(
    async (username: string) => {
      console.log(`registerUsername(${username})`);
      const result = await client.mutate<
        RegisterUsername,
        RegisterUsernameVariables
      >({
        variables: { username },
        mutation: REGISTER_USERNAME,
      });
      if (result.data?.register) {
        localStorage.setItem(AUTH_TOKEN, result.data.register);
        await refetch();
      }
    },
    [client, refetch],
  );
  const logout = React.useCallback(async () => {
    console.log(`logout()`);
    localStorage.removeItem(AUTH_TOKEN);
    await refetch();
  }, [refetch]);
  const authContext = React.useMemo(
    () => ({ user: data?.me ?? null, registerUsername, logout }),
    [data?.me, registerUsername, logout],
  );
  React.useEffect(() => {
    console.log(`AuthContext update:`, authContext.user);
  }, [authContext]);

  if (!data) {
    return <div>AuthContext loading...</div>;
  }

  return (
    <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
