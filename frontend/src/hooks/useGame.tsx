import { useLazyQuery } from '@apollo/client';
import React from 'react';
import { GET_GAME } from '../gql/GameResolver';
import { Game, GameVariables } from '../gql/types/Game';

export default function useGame(gameID: string | undefined) {
  const [fetchGame, gameData] = useLazyQuery<Game, GameVariables>(GET_GAME, {
    pollInterval: 5000,
  });
  React.useEffect(() => {
    if (gameID) {
      fetchGame({ variables: { gameID } });
    }
  }, [fetchGame, gameID]);
  return { game: gameData.data?.game, gameLoading: gameData.loading };
}

// import {
//   SubscribeToGameUpdates,
//   SubscribeToGameUpdatesVariables,
// } from '../gql/types/SubscribeToGameUpdates';

// export default function useGame(gameID: string | undefined) {
//   const [fetchGame, gameData] = useLazyQuery<Game, GameVariables>(GET_GAME, {
//     pollInterval: 5000,
//   });
//   const { subscribeToMore } = gameData;
//   React.useEffect(() => {
//     async function fetchAndSub(customGameId: string) {
//       console.log(`fetchAndSub(${customGameId})`);
//       const result = await fetchGame({
//         variables: { gameID: customGameId },
//       });
//       if (result.data?.game) {
//         console.log('useGame subscribing');
//         subscribeToMore<
//           SubscribeToGameUpdates,
//           SubscribeToGameUpdatesVariables
//         >({
//           document: SUBSCRIBE_TO_GAME_UPDATE,
//           variables: { gameID: result.data.game.id },
//           updateQuery: (prev, { subscriptionData }) => {
//             const payload = subscriptionData.data.gameUpdate;
//             console.log(
//               `useGame subscription ping for game ${payload.gameID} ${payload.action}`,
//             );
//             if (prev.game) {
//               const update = { ...prev.game };
//               // apply updates

//               // removing blobs
//               update.blobs = update.blobs.filter(
//                 (b) => payload.removedBlobs.indexOf(b.id) === -1,
//               );

//               // updating blobs
//               update.blobs = update.blobs.map((b) => {
//                 const blobUpdate = payload.updatedBlobs.find(
//                   (ub) => ub.id === b.id,
//                 );
//                 if (blobUpdate) return { ...b, ...blobUpdate };
//                 return b;
//               });

//               // updating nodes
//               update.map.nodes = update.map.nodes.map((n) => {
//                 const nodeUpdate = payload.updatedNodes.find(
//                   (un) => un.id === n.id,
//                 );
//                 if (nodeUpdate) return { ...n, ...nodeUpdate };
//                 return n;
//               });
//               return { game: update };
//             }
//             console.log('useGame prev was nullish, returning prev');
//             return { game: null };
//           },
//         });
//       } else {
//         console.error('fetchAndSub got null game');
//       }
//     }
//     if (gameID) {
//       fetchAndSub(gameID);
//     }
//   }, [fetchGame, subscribeToMore, gameID]);
//   return {
//     ...gameData,
//     gameLoading: gameData.loading,
//     game: gameData.data,
//   };
// }
