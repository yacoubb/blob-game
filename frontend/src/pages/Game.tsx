/* eslint-disable no-param-reassign */
import React from 'react';
import { BsFlagFill } from 'react-icons/bs';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import NavBar from '../components/NavBar';
import PaddedContainer from '../components/PaddedContainer';
import Button from '../components/Button';
import { useHeartbeat, useGame } from '../hooks';
import GameNotFound from '../components/GameNotFound';
import { LeaveGame } from '../gql/types/LeaveGame';
import { LEAVE_GAME } from '../gql/GameResolver';
import GameComponent from '../components/GameComponent';

function Game() {
  const { gameID } = useParams();
  if (!gameID) throw new Error(`Game.tsx gameID param missing`);

  const navigate = useNavigate();
  const [leaveGame] = useMutation<LeaveGame>(LEAVE_GAME);
  const leaveGameCallback = React.useCallback(async () => {
    // if (unityLoaded) {
    //   await unityContext.quitUnityInstance();
    // }
    const result = await leaveGame();
    console.log('leaveGame finished');
    if (result.data?.leaveGame) {
      navigate(`/`);
    }
  }, [leaveGame, navigate]);

  useHeartbeat('game');

  const parentDiv = React.useRef<HTMLDivElement | null>(null);
  // const updateSketchWithProps = useSketch(p5Sketch, parentDiv);
  const { game, gameLoading } = useGame(gameID);

  if (gameLoading) {
    return (
      <PaddedContainer>
        <NavBar />
        Game loading...
      </PaddedContainer>
    );
  }
  if (!game) {
    return <GameNotFound gameId={gameID} title="Game" />;
  }

  console.log(game);

  return (
    <PaddedContainer className="flex flex-col">
      <NavBar />
      <div className="h-full box-border flex flex-col space-y-4">
        <div id="gameContainer" className="flex-1 bg-slate-200">
          <GameComponent game={game} />
        </div>
        <Button
          className="flex space-x-4"
          color="red"
          onClick={leaveGameCallback}
        >
          <span>Surrender</span>
          <BsFlagFill className="my-auto" />
        </Button>
      </div>
    </PaddedContainer>
  );
}

export default Game;
