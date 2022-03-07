import { useMutation } from '@apollo/client';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CREATE_LOBBY } from '../gql/LobbyResolver';
import { CreateLobby } from '../gql/types/CreateLobby';
import Button from './Button';

function CreateLobbyButton() {
  const navigate = useNavigate();
  const [createGameMutation] = useMutation<CreateLobby>(CREATE_LOBBY);

  const createGame = React.useCallback(async () => {
    const createResult = await createGameMutation();
    if (createResult.data?.createLobby) {
      navigate(`/lobby/${createResult.data.createLobby.id}`);
    }
  }, [createGameMutation, navigate]);
  return (
    <Button color="green" onClick={createGame}>
      Create game
    </Button>
  );
}

export default CreateLobbyButton;
