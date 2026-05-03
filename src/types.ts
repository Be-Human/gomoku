export type Player = 'black' | 'white';
export type CellValue = Player | null;
export type Board = CellValue[][];

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  position: Position;
  player: Player;
}

export interface GameState {
  board: Board;
  currentPlayer: Player;
  winner: Player | null;
  isGameOver: boolean;
  moveHistory: Move[];
}
