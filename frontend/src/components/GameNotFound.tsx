import React from 'react';
import { Link } from 'react-router-dom';
import NavBar from './NavBar';
import Button from './Button';
import PaddedContainer from './PaddedContainer';

function GameNotFound({
  gameId,
  title,
}: {
  gameId: string;
  title: 'Game' | 'Lobby';
}) {
  return (
    <PaddedContainer>
      <div className="box-border h-full flex flex-col">
        <NavBar />
        <div className="flex flex-col justify-center items-center h-full box-border text-center">
          <div className="text-slate-500 text-sm mb-4">
            {title} with id {gameId} not found
          </div>
          <Link to="/">
            <Button>Back to menu</Button>
          </Link>
        </div>
      </div>
    </PaddedContainer>
  );
}

export default GameNotFound;
