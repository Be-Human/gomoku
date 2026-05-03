import React, { useState, useCallback, useEffect } from 'react';
import type { GameState, Player, Position, Move } from '../types';
import { createInitialGameState, makeMove, checkWinner, isBoardFull, BOARD_SIZE } from '../gameLogic';
import { getBestMove } from '../ai';
import Board from './Board';
import './Game.css';

const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [isThinking, setIsThinking] = useState(false);
  const [lastMove, setLastMove] = useState<Position | null>(null);

  const resetGame = useCallback(() => {
    setGameState(createInitialGameState());
    setLastMove(null);
    setIsThinking(false);
  }, []);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameState.isGameOver || isThinking || gameState.currentPlayer !== 'black') {
      return;
    }

    if (gameState.board[row][col] !== null) {
      return;
    }

    // 玩家落子
    const newBoard = makeMove(gameState.board, row, col, 'black');
    const newMoveHistory = [...gameState.moveHistory, { position: { row, col }, player: 'black' as Player }];

    // 检查玩家是否获胜
    if (checkWinner(newBoard, row, col, 'black')) {
      setGameState({
        ...gameState,
        board: newBoard,
        winner: 'black',
        isGameOver: true,
        moveHistory: newMoveHistory
      });
      setLastMove({ row, col });
      return;
    }

    // 检查是否平局
    if (isBoardFull(newBoard)) {
      setGameState({
        ...gameState,
        board: newBoard,
        isGameOver: true,
        moveHistory: newMoveHistory
      });
      setLastMove({ row, col });
      return;
    }

    // 更新游戏状态为AI回合
    setGameState({
      ...gameState,
      board: newBoard,
      currentPlayer: 'white',
      moveHistory: newMoveHistory
    });
    setLastMove({ row, col });
  }, [gameState, isThinking]);

  // AI回合逻辑
  useEffect(() => {
    if (gameState.currentPlayer === 'white' && !gameState.isGameOver && !isThinking) {
      setIsThinking(true);
      
      // 稍微延迟一下，让AI看起来像在思考
      const timeoutId = setTimeout(() => {
        const aiMove = getBestMove(gameState.board, 'white');
        
        if (aiMove) {
          const newBoard = makeMove(gameState.board, aiMove.row, aiMove.col, 'white');
          const newMoveHistory = [...gameState.moveHistory, { position: aiMove, player: 'white' as Player }];

          // 检查AI是否获胜
          if (checkWinner(newBoard, aiMove.row, aiMove.col, 'white')) {
            setGameState({
              ...gameState,
              board: newBoard,
              currentPlayer: 'black',
              winner: 'white',
              isGameOver: true,
              moveHistory: newMoveHistory
            });
          } else if (isBoardFull(newBoard)) {
            // 检查是否平局
            setGameState({
              ...gameState,
              board: newBoard,
              currentPlayer: 'black',
              isGameOver: true,
              moveHistory: newMoveHistory
            });
          } else {
            // 继续游戏
            setGameState({
              ...gameState,
              board: newBoard,
              currentPlayer: 'black',
              moveHistory: newMoveHistory
            });
          }
          
          setLastMove(aiMove);
        }
        
        setIsThinking(false);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [gameState.currentPlayer, gameState.isGameOver, gameState.board, gameState.moveHistory, isThinking]);

  const getStatusMessage = () => {
    if (gameState.winner) {
      return gameState.winner === 'black' ? '恭喜你获胜！' : 'AI获胜了！';
    }
    if (gameState.isGameOver) {
      return '平局！';
    }
    if (isThinking) {
      return 'AI正在思考...';
    }
    return '你的回合（黑棋）';
  };

  return (
    <div className="game-container">
      <h1 className="game-title">五子棋</h1>
      
      <div className={`status-message ${gameState.winner ? (gameState.winner === 'black' ? 'winner' : 'loser') : ''}`}>
        {getStatusMessage()}
      </div>
      
      <div className="board-wrapper">
        <Board
          board={gameState.board}
          onCellClick={handleCellClick}
          lastMove={lastMove}
          disabled={gameState.isGameOver || isThinking || gameState.currentPlayer !== 'black'}
        />
      </div>
      
      <div className="controls">
        <button className="reset-button" onClick={resetGame}>
          重新开始
        </button>
      </div>
      
      <div className="info">
        <p>棋盘大小：{BOARD_SIZE}x{BOARD_SIZE}</p>
        <p>游戏规则：五子连珠获胜</p>
        <p>玩家执黑棋先行</p>
      </div>
    </div>
  );
};

export default Game;
