import * as React from 'react';
import * as PIXI from 'pixi.js';
import * as gameMechanics from '@lobby/gameserver/dist/game';
import * as gameTypes from '@lobby/gameserver/dist/types';
import { Application } from 'pixi.js';
import { useGame } from '../hooks';
import GameRenderer from './GameRenderer';

interface GameComponentProps {
  game: ReturnType<typeof useGame>['game'];
}

const GameWrapper: React.FC<GameComponentProps> = ({ game }) => {
  // set up socket.io connection
  // connect using access token (if we have one)
  // get initial state from connection request
  // wait for game updates
  // update local state with data from game updates

  const [map, setMap] = React.useState<gameTypes.Map>();
  const [pixiApp, setPixiApp] = React.useState<PIXI.Application>();
  const [renderer, setRenderer] = React.useState<GameRenderer>();
  const renderCallback = React.useRef<() => void>();

  if (renderer && pixiApp && map) {
    renderCallback.current = () => renderer.render(map, pixiApp);
  }

  React.useLayoutEffect(() => {
    // CDM initialisation
    const gameDiv = document.getElementById('game');
    if (!gameDiv) throw new Error('Game div not found');
    const newPixi = new PIXI.Application({
      resizeTo: gameDiv,
      width: 100,
      height: 100,
      backgroundColor: 0,
      backgroundAlpha: 1,
    });
    newPixi.view.className = 'absolute';
    newPixi.stage.interactive = true;
    setPixiApp(newPixi);
    gameDiv.appendChild(newPixi.view);

    const newRenderer = new GameRenderer();
    setRenderer(newRenderer);
    const resizeFunc = newPixi.resize;
    newPixi.resize = () => {
      resizeFunc();
      renderCallback.current?.();
    };

    const newMap = gameMechanics.generateMap(2);
    setMap(newMap);
    newMap.blobs.test = {
      id: 'test',
      aToB: true,
      edge: Object.keys(newMap.edges)[0],
      mass: 50,
      progress: 0.3,
      team: 1,
    };
    console.log(newMap);
    // TODO set up socket.io and listen for changes

    newRenderer.render(newMap, newPixi);

    return () => {
      // TODO clean up socket.io and remove pixi elem
    };
  }, []);

  React.useEffect(() => {
    console.log('setting intervals for moving and stepping');
    setInterval(() => {
      setMap((oldMap) => {
        if (!oldMap) return oldMap;
        const update = gameMechanics.step(oldMap, 0.1);
        const updatedMap = gameMechanics.applyUpdates(oldMap, [update]);
        return updatedMap;
      });
    }, 1000 / 60);

    // setInterval(() => {
    //   setMap((oldMap) => {
    //     if (!oldMap) return oldMap;
    //     const update = gameMechanics.move(oldMap, 0.1);
    //     console.log(update);
    //     const updatedMap = gameMechanics.applyUpdates(oldMap, [update]);
    //     return updatedMap;
    //   });
    // }, 50);
  }, []);

  React.useEffect(() => {
    if (pixiApp && map && renderer) {
      const edgeClickCallback = (edgeID: string, aToB: boolean) => {
        setMap((oldMap) => {
          if (!oldMap) return oldMap;
          const update = gameMechanics.click(oldMap, edgeID, aToB, 1);
          return gameMechanics.applyUpdates(oldMap, [update]);
        });
      };
      renderer.render(map, pixiApp, edgeClickCallback);
    }
  }, [map, pixiApp, renderer]);

  return <div id="game" className="w-100 h-full" />;
};

export default GameWrapper;

// we can consider two approaches to rendering the game

// 1. Complete re-render on new game state
//    We have a component that takes the game state as a prop
//    The component keeps an internal store of things it has rendered previously
//    With the new props:
//      If we have a new thing (e.g. new blob), create a new graphic, give it an id and add it to pixi
//      If we are updating something, get the existing graphic and update it
//    After iterating through the objects, anything that did not get added or updated (i.e. is not in the game) is removed

// 2. Re-render based on game update
//    Game updates inform us about game state via the changes from the previous state
//    Use these changes to re-render things, don't waste time re-rendering things that haven't changed

// 1 is more flexible but possibly slower
// 2 is faster but tightly coupled to game update architecture
