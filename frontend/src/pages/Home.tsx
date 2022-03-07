import React from 'react';
import { Navigate } from 'react-router-dom';
import CreateGameButton from '../components/CreateLobbyButton';
import GameList from '../components/LobbyList';
import NavBar from '../components/NavBar';
import PaddedContainer from '../components/PaddedContainer';
import { useMyLobby } from '../hooks';

function Home() {
  const { myLobby } = useMyLobby();
  // TODO navigate to myGame as well
  if (myLobby?.myLobby) {
    return <Navigate to={`/lobby/${myLobby.myLobby.id}`} />;
  }
  return (
    <PaddedContainer>
      <NavBar />
      <GameList />
      <CreateGameButton />
    </PaddedContainer>
  );
}

export default Home;
