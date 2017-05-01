import {makeGameState, update, GameState, PlayerId, Action} from './src/game-state';

export type MessageToServer = UpdatePlayerActionsMessage;
export type MessageFromServer = UpdateActionsMessage | UpdateGameStateMessage | ProcessActionsMessage | SetTimerMessage;

export type UpdatePlayerActionsMessage = {
  type: string;
  actions: Action[];
  playerId?: PlayerId;
}

export type UpdateActionsMessage = {
  type: string;
  actions: {[playerId: string]: Action[]};
  playerId?: PlayerId;
}

export type MessageForPlayer = {
  playerId?: string
}

export type UpdateGameStateMessage = {
  type: string;
  gameState: GameState;
  playerId?: string
}

export type ProcessActionsMessage = {
  type: string;
  playerId?: string
}

export type SetTimerMessage = {
  type: string;
  timer: number;
  playerId?: string
}
