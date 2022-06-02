export type Player = {
  id: string;
  username: string;
};
export type NewGameRequest = {
  players: Player[];
  gameID: string;
};
export type PlayerResponse = Player & {
  accessToken: string;
  playerIndex: number;
};
export type NewGamePayload = {
  players: PlayerResponse[];
  port: number;
  serverAddress: string;
};

export type Coordinates = {
  x: number;
  y: number;
};
export type Node = {
  id: string;
  team: number;
  mass: number;
  growIntervalMs: number;
  growMass: number;
} & Coordinates;

export type Edge = {
  id: string;
  nodeA: string; // id
  nodeB: string; // id
};

export type Blob = {
  id: string;
  edge: string; // id
  aToB: boolean;
  progress: number;
  team: number;
  mass: number;
};

export type Map = {
  nodes: Record<string, Node>;
  edges: Record<string, Edge>;
  blobs: Record<string, Blob>;
};
