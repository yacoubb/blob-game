/* eslint-disable no-continue */
// logic for blob game

import { nanoid } from 'nanoid';
import type { Node, Edge, Blob, Map, Coordinates } from './types';

const EDGE_TRAVEL_DURATION_S = 2;
const STEP_INTERVAL_MS = 50;
const MAX_MASS = 100;

type BlobWithCoordinates = Blob & Coordinates;

export function generateMap(playerCount: number): Map {
  const nodes: Map['nodes'] = {};
  const startNodes = Math.max(playerCount, 4); // always have at least 4 start nodes
  for (let i = 0; i < startNodes; i += 1) {
    const t = (i / playerCount) * Math.PI;
    const x = (Math.sin(t) + 1) / 2;
    const y = (Math.cos(t) + 1) / 2;

    const node: Node = {
      id: nanoid(),
      team: i < playerCount ? i + 1 : 0, // set team to neutral or player team depending on number of players
      mass: i < playerCount ? 50 : 20,
      x,
      y,
      growIntervalMs: 2000,
      growMass: 10,
    };
    nodes[node.id] = node;
  }

  const edges: Map['edges'] = {};
  for (let i = 0; i < Object.keys(nodes).length; i += 1) {
    const edge: Edge = {
      id: nanoid(),
      nodeA: nodes[Object.keys(nodes)[i % Object.keys(nodes).length]].id,
      nodeB: nodes[Object.keys(nodes)[(i + 1) % Object.keys(nodes).length]].id,
    };
    edges[edge.id] = edge;
  }

  const blobs: Map['blobs'] = {};

  const map: Map = {
    nodes,
    edges,
    blobs,
  };

  return map;
}

type BlobUpdate = {
  id: string;
  progress?: number;
  mass?: number;
  team?: number;
};

type NodeUpdate = {
  id: string;
  mass: number;
  team?: number;
};

type MapUpdate = {
  createdBlobs?: Blob[];
  updatedBlobs?: BlobUpdate[];
  deletedBlobs?: string[];
  updatedNodes?: NodeUpdate[];
};

export function massToRadius(mass: number): number {
  return (mass / MAX_MASS) * 0.05;
}

export function dist(a: Coordinates, b: Coordinates): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function getStartNode(map: Map, blobID: string): Node {
  const blob = map.blobs[blobID];
  const edge = map.edges[blob.edge];
  return { ...map.nodes[blob.aToB ? edge.nodeA : edge.nodeB] };
}

export function getEndNode(map: Map, blobID: string): Node {
  const blob = map.blobs[blobID];
  const edge = map.edges[blob.edge];
  return { ...map.nodes[blob.aToB ? edge.nodeB : edge.nodeA] };
}

export function getBlobPos(
  map: Map,
  blobID: string,
  progress?: number,
): Coordinates {
  const b = map.blobs[blobID];
  const startNode = getStartNode(map, b.id);
  const endNode = getEndNode(map, b.id);

  const x = startNode.x + (endNode.x - startNode.x) * (progress ?? b.progress);
  const y = startNode.y + (endNode.y - startNode.y) * (progress ?? b.progress);
  return { x, y };
}

export function click(
  map: Map,
  edgeID: string,
  aToB: boolean,
  playerTeam: number,
): MapUpdate {
  const edge = map.edges[edgeID];
  const startNode = map.nodes[aToB ? edge.nodeA : edge.nodeB];
  if (startNode.team !== playerTeam || startNode.mass < 5) {
    return {};
  }
  const createdBlob: Blob = {
    id: nanoid(),
    team: playerTeam,
    aToB,
    edge: edgeID,
    progress: 0,
    mass: startNode.mass / 2,
  };
  const updatedNode: NodeUpdate = {
    id: startNode.id,
    mass: startNode.mass / 2,
  };

  return { createdBlobs: [createdBlob], updatedNodes: [updatedNode] };
}

export function move(map: Map, multiplier = 1): MapUpdate {
  const increment =
    (multiplier * (STEP_INTERVAL_MS / 1000)) / EDGE_TRAVEL_DURATION_S;
  return {
    updatedBlobs: Object.keys(map.blobs).map(blobID => {
      const b = map.blobs[blobID];
      const progress =
        b.progress + increment / ((b.mass + MAX_MASS / 2) / MAX_MASS);

      return { id: b.id, progress };
    }),
  };
}

export function grow(map: Map, nodeID: string, growMass: number): MapUpdate {
  return {
    updatedNodes: [
      {
        id: nodeID,
        mass: Math.min(map.nodes[nodeID].mass + growMass, MAX_MASS),
      },
    ],
  };
}

export function applyUpdates(map: Map, updates: MapUpdate[]): Map {
  const concatenatedUpdate = updates.reduce((total, curr) => {
    return {
      createdBlobs: (total.createdBlobs ?? []).concat(curr.createdBlobs ?? []),
      deletedBlobs: (total.deletedBlobs ?? []).concat(curr.deletedBlobs ?? []),
      updatedBlobs: (total.updatedBlobs ?? []).concat(curr.updatedBlobs ?? []),
      updatedNodes: (total.updatedNodes ?? []).concat(curr.updatedNodes ?? []),
    };
  });

  const updatedMap: Map = {
    blobs: {},
    edges: {},
    nodes: {},
  };

  // insert created blobs
  for (const created of concatenatedUpdate.createdBlobs ?? []) {
    updatedMap.blobs[created.id] = { ...created };
  }
  // insert previous blobs
  for (const existing of Object.values(map.blobs)) {
    updatedMap.blobs[existing.id] = { ...existing };
  }
  // delete blobs
  for (const deletedID of concatenatedUpdate.deletedBlobs ?? []) {
    delete updatedMap.blobs[deletedID];
  }
  // update blobs
  for (const updated of concatenatedUpdate.updatedBlobs ?? []) {
    if (updated.id in updatedMap.blobs) {
      updatedMap.blobs[updated.id] = {
        ...updatedMap.blobs[updated.id],
        ...updated,
      };
    }
  }

  // insert previous nodes
  for (const existingNode of Object.values(map.nodes)) {
    updatedMap.nodes[existingNode.id] = { ...existingNode };
  }
  // update nodes
  for (const updatedNode of concatenatedUpdate.updatedNodes ?? []) {
    updatedMap.nodes[updatedNode.id] = {
      ...updatedMap.nodes[updatedNode.id],
      ...updatedNode,
    };
  }

  // pass same edges
  updatedMap.edges = map.edges;

  return updatedMap;
}

export function step(map: Map, multiplier = 1): MapUpdate {
  // progress blobs
  // compute collisions
  // update/remove blobs and update nodes

  const update: MapUpdate = {
    updatedBlobs: [],
    deletedBlobs: [],
    updatedNodes: [],
  };
  // move blobs along
  const moveUpdate = move(map, multiplier);
  update.updatedBlobs = moveUpdate.updatedBlobs;
  const movedBlobs = applyUpdates(map, [moveUpdate]);

  // keep a working copy of blobs to avoid repeat collisions
  const modifiedBlobs: Record<string, BlobWithCoordinates> = {};
  // index for finding blobs on the same edge
  const edgeToBlobs: Record<string, string[]> = {};

  // update blob progress
  Object.values(movedBlobs.blobs).forEach(b => {
    const edge = map.edges[b.edge];
    const { x, y } = getBlobPos(movedBlobs, b.id);
    const updatedBlob = { ...b, x, y };
    edgeToBlobs[edge.id] = [...(edgeToBlobs[edge.id] ?? []), b.id];
    modifiedBlobs[b.id] = updatedBlob;

    return updatedBlob;
  });

  // spread list to create shallow copy since we will be modifying keys
  for (const blobID of [...Object.keys(modifiedBlobs)]) {
    // if the blobID has not been removed yet
    if (blobID in modifiedBlobs) {
      const blob = modifiedBlobs[blobID];
      const endNode = getEndNode(map, blobID);
      const blobToNodeDist = dist(blob, endNode);
      if (
        blobToNodeDist <
        massToRadius(blob.mass) + massToRadius(endNode.mass)
      ) {
        console.log('blob-node collision');
        if (blob.team === endNode.team) {
          // TODO experiment with max mass mechanics
          endNode.mass = Math.min(endNode.mass + blob.mass, MAX_MASS);
        } else {
          endNode.mass -= blob.mass;
          if (endNode.mass < 0) {
            endNode.team = blob.team;
            endNode.mass = -endNode.mass;
          }
        }
        update.updatedNodes?.push({
          id: endNode.id,
          mass: endNode.mass,
          team: endNode.team,
        });
        update.deletedBlobs?.push(blob.id);
        delete modifiedBlobs[blob.id];
        continue;
      }
      // check if blob collides with other blobs on edge
      for (const otherID of edgeToBlobs[blob.edge]) {
        if (blobID !== otherID) {
          // check the blob hasn't been deleted in a previous collision
          if (otherID in modifiedBlobs) {
            const other = modifiedBlobs[otherID];
            if (blob.mass !== 0 && other.mass !== 0) {
              const blobToBlobDist = dist(blob, other);
              if (
                blobToBlobDist <
                massToRadius(blob.mass) + massToRadius(other.mass)
              ) {
                const [bigger, smaller] =
                  blob.mass > other.mass ? [blob, other] : [other, blob];
                if (blob.team === other.team) {
                  // same team, combine
                  bigger.mass += smaller.mass;
                } else {
                  // other team, attack
                  bigger.mass -= smaller.mass;
                }
                update.updatedBlobs?.push({ id: bigger.id, mass: bigger.mass });
                update.deletedBlobs?.push(smaller.id);
                delete modifiedBlobs[smaller.id];
              }
            }
          }
        }
      }
    }
  }
  return update;
}
