import type { Board, Player, Position, CellValue, GameState, GameMode } from './types';

export const BOARD_SIZE = 15;
export const CAPTURE_WIN_COUNT = 5;

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

export function createInitialGameState(gameMode: GameMode = 'standard'): GameState {
  return {
    board: createEmptyBoard(),
    currentPlayer: 'black',
    winner: null,
    isGameOver: false,
    moveHistory: [],
    gameMode,
    blackCaptures: 0,
    whiteCaptures: 0
  };
}

export function getOpponent(player: Player): Player {
  return player === 'black' ? 'white' : 'black';
}

export function checkCaptures(board: Board, row: number, col: number, player: Player): Position[] {
  const capturedPieces: Position[] = [];
  const opponent = getOpponent(player);
  
  for (const [dr, dc] of DIRECTIONS) {
    const checkDirection = (dir: number) => {
      const positions: Position[] = [];
      
      for (let i = 1; i <= 2; i++) {
        const newRow = row + dr * dir * i;
        const newCol = col + dc * dir * i;
        
        if (!isValidPosition(newRow, newCol)) {
          return [];
        }
        
        const cell = board[newRow][newCol];
        if (cell === opponent) {
          positions.push({ row: newRow, col: newCol });
        } else if (cell === player) {
          if (positions.length === 1) {
            return positions;
          } else {
            return [];
          }
        } else {
          return [];
        }
      }
      
      if (positions.length === 2) {
        const nextRow = row + dr * dir * 3;
        const nextCol = col + dc * dir * 3;
        
        if (isValidPosition(nextRow, nextCol) && board[nextRow][nextCol] === player) {
          return positions;
        }
      }
      
      return [];
    };
    
    const positiveCaptures = checkDirection(1);
    const negativeCaptures = checkDirection(-1);
    
    capturedPieces.push(...positiveCaptures, ...negativeCaptures);
  }
  
  return capturedPieces;
}

export function applyCaptures(board: Board, captures: Position[]): Board {
  const newBoard = board.map(row => [...row]);
  for (const { row, col } of captures) {
    newBoard[row][col] = null;
  }
  return newBoard;
}

export function checkCaptureWin(blackCaptures: number, whiteCaptures: number): Player | null {
  if (blackCaptures >= CAPTURE_WIN_COUNT) {
    return 'black';
  }
  if (whiteCaptures >= CAPTURE_WIN_COUNT) {
    return 'white';
  }
  return null;
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
