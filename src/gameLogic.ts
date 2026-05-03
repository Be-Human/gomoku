import type { Board, Player, Position, CellValue, GameState } from './types';

export const BOARD_SIZE = 15;

export function createEmptyBoard(): Board {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
}

export function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function isCellEmpty(board: Board, row: number, col: number): boolean {
  return isValidPosition(row, col) && board[row][col] === null;
}

export function makeMove(board: Board, row: number, col: number, player: Player): Board {
  if (!isValidPosition(row, col) || !isCellEmpty(board, row, col)) {
    return board;
  }
  
  const newBoard = board.map(row => [...row]);
  newBoard[row][col] = player;
  return newBoard;
}

const DIRECTIONS = [
  [0, 1],   // 水平
  [1, 0],   // 垂直
  [1, 1],   // 对角线 \
  [1, -1]   // 对角线 /
];

export function checkWinner(board: Board, row: number, col: number, player: Player): boolean {
  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;
    
    // 检查正方向
    for (let i = 1; i < 5; i++) {
      const newRow = row + dr * i;
      const newCol = col + dc * i;
      if (isValidPosition(newRow, newCol) && board[newRow][newCol] === player) {
        count++;
      } else {
        break;
      }
    }
    
    // 检查反方向
    for (let i = 1; i < 5; i++) {
      const newRow = row - dr * i;
      const newCol = col - dc * i;
      if (isValidPosition(newRow, newCol) && board[newRow][newCol] === player) {
        count++;
      } else {
        break;
      }
    }
    
    if (count >= 5) {
      return true;
    }
  }
  
  return false;
}

export function isBoardFull(board: Board): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === null) {
        return false;
      }
    }
  }
  return true;
}

export function createInitialGameState(): GameState {
  return {
    board: createEmptyBoard(),
    currentPlayer: 'black',
    winner: null,
    isGameOver: false,
    moveHistory: []
  };
}

export function getAvailableMoves(board: Board): Position[] {
  const moves: Position[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === null) {
        moves.push({ row, col });
      }
    }
  }
  return moves;
}
