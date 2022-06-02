/* eslint-disable no-param-reassign */
import React from 'react';
import { BsFlagFill } from 'react-icons/bs';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import Unity, { UnityContext } from 'react-unity-webgl';
import NavBar from '../components/NavBar';
import PaddedContainer from '../components/PaddedContainer';
import Button from '../components/Button';
import { useHeartbeat, useGame } from '../hooks';
import GameNotFound from '../components/GameNotFound';
import { LeaveGame } from '../gql/types/LeaveGame';
import { LEAVE_GAME } from '../gql/GameResolver';

window.alert = (message: string) => {
  // ignoring alerts
  console.error(message);
};

window.onerror = (...args: any[]) => {
  if (typeof args[0] === 'string') {
    if (/Uncaught \d+/gm.test(args[0])) {
      // weird uncaught error from https://github.com/vis2k/Mirror/pull/3075
      // eslint-disable-next-line no-restricted-globals
      location.reload();
    }
  }
  console.log(args, typeof args);
};
const BUILD_NAME = 'a10';
const unityContext = new UnityContext({
  loaderUrl: `${process.env.PUBLIC_URL}/unitybuild/Build/${BUILD_NAME}.loader.js`,
  dataUrl: `${process.env.PUBLIC_URL}/unitybuild/Build/${BUILD_NAME}.data`,
  frameworkUrl: `${process.env.PUBLIC_URL}/unitybuild/Build/${BUILD_NAME}.framework.js`,
  codeUrl: `${process.env.PUBLIC_URL}/unitybuild/Build/${BUILD_NAME}.wasm`,
});

unityContext.on('debug', (line) => {
  console.warn(`external debug ${line}`);
});

unityContext.on('error', (line) => {
  console.warn(`external err ${line}`);
});

const bridgeGameobjectName = '[BridgeJS]';

function Game() {
  const { gameID } = useParams();
  if (!gameID) throw new Error(`Game.tsx gameID param missing`);
  const [unityLoaded, setUnityLoaded] = React.useState(false);
  const [sentInitMessages, setSentInitMessages] = React.useState(false);

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
  }, [unityLoaded, leaveGame, navigate]);

  useHeartbeat('game');

  const parentDiv = React.useRef<HTMLDivElement | null>(null);
  // const updateSketchWithProps = useSketch(p5Sketch, parentDiv);
  const { game, gameLoading } = useGame(gameID);
  React.useEffect(() => {
    if (game) {
      // updateSketchWithProps?.(game.game);
      console.log(game);
      if (game.myAccessToken && unityLoaded && !sentInitMessages) {
        unityContext.send(
          bridgeGameobjectName,
          'SetServerAddress',
          game.serverAddress,
        );
        unityContext.send(bridgeGameobjectName, 'SetPort', game.port);
        unityContext.send(
          bridgeGameobjectName,
          'SetAccessToken',
          game.myAccessToken,
        );
        unityContext.send(bridgeGameobjectName, 'ConnectClient');

        setSentInitMessages(true);
      }
    }
  }, [game, unityLoaded, sentInitMessages]);
  React.useEffect(() => {
    unityContext.on('loaded', () => {
      console.log('Unity loaded');
      // TODO replace this with console log watching
      setTimeout(() => {
        setUnityLoaded(true);
      }, 2000);
    });
  }, []);
  React.useLayoutEffect(() => {
    unityContext.on('canvas', (canvas) => {
      const unityContextResizeObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          canvas.width = entry.contentRect.width;
          canvas.height = entry.contentRect.height;
        });
      });
      const sketchDiv = document.getElementById('sketchContainer');
      if (sketchDiv) unityContextResizeObserver.observe(sketchDiv);
    });
  }, []);

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
        <div id="sketchContainer" className="flex-1 bg-slate-200">
          <div ref={parentDiv} id="sketch" className="absolute">
            <Unity
              unityContext={unityContext}
              matchWebGLToCanvasSize={false}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
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
