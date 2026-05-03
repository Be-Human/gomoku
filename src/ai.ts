import type { Board, Player, Position } from './types';
import { isValidPosition, BOARD_SIZE, makeMove, checkWinner } from './gameLogic';

const DIRECTIONS = [
  [0, 1],   // 水平
  [1, 0],   // 垂直
  [1, 1],   // 对角线 \
  [1, -1]   // 对角线 /
];

// 评分系统
const SCORES = {
  WIN: 100000,      // 五子连珠
  LIVE_FOUR: 10000, // 活四（两端都空）
  RUSH_FOUR: 1000,  // 冲四（只有一端空）
  LIVE_THREE: 500,  // 活三
  RUSH_THREE: 50,   // 冲三
  LIVE_TWO: 10,     // 活二
  RUSH_TWO: 1       // 冲二
};

// 检查是否有相邻的棋子（用于减少搜索范围）
function hasNeighbor(board: Board, row: number, col: number): boolean {
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      if (dr === 0 && dc === 0) continue;
      const newRow = row + dr;
      const newCol = col + dc;
      if (isValidPosition(newRow, newCol) && board[newRow][newCol] !== null) {
        return true;
      }
    }
  }
  return false;
}

// 获取候选落子点（只有相邻有棋子的位置才考虑）
function getCandidateMoves(board: Board): Position[] {
  const candidates: Position[] = [];
  
  // 检查是否为空棋盘
  let isEmpty = true;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] !== null) {
        isEmpty = false;
        break;
      }
    }
    if (!isEmpty) break;
  }
  
  // 空棋盘，返回中心位置
  if (isEmpty) {
    return [{ row: Math.floor(BOARD_SIZE / 2), col: Math.floor(BOARD_SIZE / 2) }];
  }
  
  // 收集所有有相邻棋子的空位
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === null && hasNeighbor(board, row, col)) {
        candidates.push({ row, col });
      }
    }
  }
  
  return candidates;
}

// 分析单个方向的棋型
function analyzeDirection(
  board: Board,
  row: number,
  col: number,
  dr: number,
  dc: number,
  player: Player
): { count: number; openEnds: number } {
  let count = 1;
  let openEnds = 0;
  
  // 检查正方向
  let blocked = false;
  for (let i = 1; i < 5; i++) {
    const newRow = row + dr * i;
    const newCol = col + dc * i;
    
    if (!isValidPosition(newRow, newCol)) {
      blocked = true;
      break;
    }
    
    const cell = board[newRow][newCol];
    if (cell === player) {
      count++;
    } else if (cell === null) {
      openEnds++;
      break;
    } else {
      blocked = true;
      break;
    }
  }
  
  // 检查反方向
  for (let i = 1; i < 5; i++) {
    const newRow = row - dr * i;
    const newCol = col - dc * i;
    
    if (!isValidPosition(newRow, newCol)) {
      break;
    }
    
    const cell = board[newRow][newCol];
    if (cell === player) {
      count++;
    } else if (cell === null) {
      if (!blocked) openEnds++;
      break;
    } else {
      break;
    }
  }
  
  return { count, openEnds };
}

// 评估单个位置的分数
function evaluatePosition(
  board: Board,
  row: number,
  col: number,
  player: Player
): number {
  let totalScore = 0;
  
  for (const [dr, dc] of DIRECTIONS) {
    const { count, openEnds } = analyzeDirection(board, row, col, dr, dc, player);
    
    if (count >= 5) {
      totalScore += SCORES.WIN;
    } else if (count === 4) {
      if (openEnds === 2) {
        totalScore += SCORES.LIVE_FOUR;
      } else if (openEnds === 1) {
        totalScore += SCORES.RUSH_FOUR;
      }
    } else if (count === 3) {
      if (openEnds === 2) {
        totalScore += SCORES.LIVE_THREE;
      } else if (openEnds === 1) {
        totalScore += SCORES.RUSH_THREE;
      }
    } else if (count === 2) {
      if (openEnds === 2) {
        totalScore += SCORES.LIVE_TWO;
      } else if (openEnds === 1) {
        totalScore += SCORES.RUSH_TWO;
      }
    }
  }
  
  return totalScore;
}

// 评估整个棋盘的分数（对于当前玩家）
function evaluateBoard(board: Board, player: Player): number {
  const opponent: Player = player === 'black' ? 'white' : 'black';
  let totalScore = 0;
  
  // 计算玩家的分数
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === player) {
        totalScore += evaluatePosition(board, row, col, player);
      } else if (board[row][col] === opponent) {
        totalScore -= evaluatePosition(board, row, col, opponent);
      }
    }
  }
  
  return totalScore;
}

// 简单的贪心AI：选择分数最高的位置
export function getBestMove(board: Board, player: Player): Position | null {
  const candidates = getCandidateMoves(board);
  
  if (candidates.length === 0) {
    return null;
  }
  
  let bestScore = -Infinity;
  let bestMove: Position | null = null;
  
  for (const move of candidates) {
    // 模拟落子
    const newBoard = makeMove(board, move.row, move.col, player);
    
    // 检查是否直接获胜
    if (checkWinner(newBoard, move.row, move.col, player)) {
      return move;
    }
    
    // 计算进攻分数
    const attackScore = evaluatePosition(newBoard, move.row, move.col, player);
    
    // 计算防守分数（如果对手在这里落子的分数）
    const opponent: Player = player === 'black' ? 'white' : 'black';
    const opponentBoard = makeMove(board, move.row, move.col, opponent);
    const defenseScore = evaluatePosition(opponentBoard, move.row, move.col, opponent);
    
    // 总分数 = 进攻分数 + 防守分数（防守稍微重要一点）
    const totalScore = attackScore + defenseScore * 1.2;
    
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMove = move;
    }
  }
  
  return bestMove;
}

// 更高级的AI：使用极小极大算法（可选）
// 这里使用简化版本的贪心算法，已经足够强大
