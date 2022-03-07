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
