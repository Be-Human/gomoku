import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, Player, Position, Move } from '../types';
import { createInitialGameState, makeMove, checkWinner, isBoardFull, BOARD_SIZE } from '../gameLogic';
import { getBestMove } from '../ai';
import Board from './Board';
import './Game.css';

const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [isThinking, setIsThinking] = useState(false);
  const [lastMove, setLastMove] = useState<Position | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetGame = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
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
    // 只有当轮到AI且游戏未结束且不在思考中时才触发
    if (gameState.currentPlayer === 'white' && !gameState.isGameOver && !isThinking) {
      setIsThinking(true);
      
      // 稍微延迟一下，让AI看起来像在思考
      timeoutRef.current = setTimeout(() => {
        // 使用函数式更新来确保我们使用的是最新的状态
        setGameState(prevState => {
          const aiMove = getBestMove(prevState.board, 'white');
          
          if (!aiMove) {
            setIsThinking(false);
            return prevState;
          }
          
          const newBoard = makeMove(prevState.board, aiMove.row, aiMove.col, 'white');
          const newMoveHistory = [...prevState.moveHistory, { position: aiMove, player: 'white' as Player }];
          
          setLastMove(aiMove);
          setIsThinking(false);
          
          // 检查AI是否获胜
          if (checkWinner(newBoard, aiMove.row, aiMove.col, 'white')) {
            return {
              ...prevState,
              board: newBoard,
              currentPlayer: 'black',
              winner: 'white',
              isGameOver: true,
              moveHistory: newMoveHistory
            };
          } else if (isBoardFull(newBoard)) {
            // 检查是否平局
            return {
              ...prevState,
              board: newBoard,
              currentPlayer: 'black',
              isGameOver: true,
              moveHistory: newMoveHistory
            };
          } else {
            // 继续游戏
            return {
              ...prevState,
              board: newBoard,
              currentPlayer: 'black',
              moveHistory: newMoveHistory
            };
          }
        });
      }, 500);
    }
    
    // 清理函数
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [gameState.currentPlayer, gameState.isGameOver]);

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
