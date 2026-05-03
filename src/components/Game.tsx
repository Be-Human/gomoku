import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, Player, Position, Move, GameMode } from '../types';
import { 
  createInitialGameState, 
  makeMove, 
  checkWinner, 
  isBoardFull, 
  BOARD_SIZE,
  CAPTURE_WIN_COUNT,
  checkCaptures,
  applyCaptures,
  checkCaptureWin
} from '../gameLogic';
import { getBestMove } from '../ai';
import Board from './Board';
import './Game.css';

const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [isThinking, setIsThinking] = useState(false);
  const [lastMove, setLastMove] = useState<Position | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('standard');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetGame = useCallback((mode: GameMode = gameMode) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setGameState(createInitialGameState(mode));
    setLastMove(null);
    setIsThinking(false);
    setGameMode(mode);
  }, [gameMode]);

  const handleModeChange = useCallback((mode: GameMode) => {
    if (mode !== gameMode) {
      resetGame(mode);
    }
  }, [gameMode, resetGame]);

  const undoMove = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const { moveHistory } = gameState;
    if (moveHistory.length === 0) {
      return;
    }

    if (moveHistory.length === 1) {
      const [lastPlayerMove] = moveHistory;
      const newBoard = gameState.board.map(row => [...row]);
      newBoard[lastPlayerMove.position.row][lastPlayerMove.position.col] = null;
      
      if (lastPlayerMove.capturedPieces) {
        for (const pos of lastPlayerMove.capturedPieces) {
          newBoard[pos.row][pos.col] = 'white';
        }
      }

      const newBlackCaptures = lastPlayerMove.capturedPieces 
        ? gameState.blackCaptures - lastPlayerMove.capturedPieces.length 
        : gameState.blackCaptures;

      setGameState({
        ...gameState,
        board: newBoard,
        currentPlayer: 'black',
        winner: null,
        isGameOver: false,
        moveHistory: [],
        blackCaptures: newBlackCaptures
      });
      setLastMove(null);
      setIsThinking(false);
      return;
    }

    const lastPlayerMove = moveHistory[moveHistory.length - 2];
    const lastAiMove = moveHistory[moveHistory.length - 1];
    const newMoveHistory = moveHistory.slice(0, -2);

    const newBoard = gameState.board.map(row => [...row]);
    newBoard[lastPlayerMove.position.row][lastPlayerMove.position.col] = null;
    newBoard[lastAiMove.position.row][lastAiMove.position.col] = null;

    let newBlackCaptures = gameState.blackCaptures;
    let newWhiteCaptures = gameState.whiteCaptures;

    if (lastPlayerMove.capturedPieces) {
      for (const pos of lastPlayerMove.capturedPieces) {
        newBoard[pos.row][pos.col] = 'white';
      }
      newBlackCaptures -= lastPlayerMove.capturedPieces.length;
    }

    if (lastAiMove.capturedPieces) {
      for (const pos of lastAiMove.capturedPieces) {
        newBoard[pos.row][pos.col] = 'black';
      }
      newWhiteCaptures -= lastAiMove.capturedPieces.length;
    }

    const secondLastMove = newMoveHistory.length > 0 
      ? newMoveHistory[newMoveHistory.length - 1].position 
      : null;

    setGameState({
      ...gameState,
      board: newBoard,
      currentPlayer: 'black',
      winner: null,
      isGameOver: false,
      moveHistory: newMoveHistory,
      blackCaptures: newBlackCaptures,
      whiteCaptures: newWhiteCaptures
    });
    setLastMove(secondLastMove);
    setIsThinking(false);
  }, [gameState]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameState.isGameOver || isThinking || gameState.currentPlayer !== 'black') {
      return;
    }

    if (gameState.board[row][col] !== null) {
      return;
    }

    let newBoard = makeMove(gameState.board, row, col, 'black');
    let capturedPieces: Position[] = [];
    let newBlackCaptures = gameState.blackCaptures;

    if (gameState.gameMode === 'capture') {
      capturedPieces = checkCaptures(newBoard, row, col, 'black');
      if (capturedPieces.length > 0) {
        newBoard = applyCaptures(newBoard, capturedPieces);
        newBlackCaptures += capturedPieces.length;
      }
    }

    const newMoveHistory = [...gameState.moveHistory, { 
      position: { row, col }, 
      player: 'black' as Player,
      capturedPieces: capturedPieces.length > 0 ? capturedPieces : undefined
    }];

    if (checkWinner(newBoard, row, col, 'black')) {
      setGameState({
        ...gameState,
        board: newBoard,
        winner: 'black',
        isGameOver: true,
        moveHistory: newMoveHistory,
        blackCaptures: newBlackCaptures
      });
      setLastMove({ row, col });
      return;
    }

    if (gameState.gameMode === 'capture') {
      const captureWinner = checkCaptureWin(newBlackCaptures, gameState.whiteCaptures);
      if (captureWinner === 'black') {
        setGameState({
          ...gameState,
          board: newBoard,
          winner: 'black',
          isGameOver: true,
          moveHistory: newMoveHistory,
          blackCaptures: newBlackCaptures
        });
        setLastMove({ row, col });
        return;
      }
    }

    if (isBoardFull(newBoard)) {
      setGameState({
        ...gameState,
        board: newBoard,
        isGameOver: true,
        moveHistory: newMoveHistory,
        blackCaptures: newBlackCaptures
      });
      setLastMove({ row, col });
      return;
    }

    setGameState({
      ...gameState,
      board: newBoard,
      currentPlayer: 'white',
      moveHistory: newMoveHistory,
      blackCaptures: newBlackCaptures
    });
    setLastMove({ row, col });
  }, [gameState, isThinking]);

  useEffect(() => {
    if (gameState.currentPlayer === 'white' && !gameState.isGameOver && !isThinking) {
      setIsThinking(true);
      
      timeoutRef.current = setTimeout(() => {
        setGameState(prevState => {
          const aiMove = getBestMove(prevState.board, 'white');
          
          if (!aiMove) {
            setIsThinking(false);
            return prevState;
          }
          
          let newBoard = makeMove(prevState.board, aiMove.row, aiMove.col, 'white');
          let capturedPieces: Position[] = [];
          let newWhiteCaptures = prevState.whiteCaptures;

          if (prevState.gameMode === 'capture') {
            capturedPieces = checkCaptures(newBoard, aiMove.row, aiMove.col, 'white');
            if (capturedPieces.length > 0) {
              newBoard = applyCaptures(newBoard, capturedPieces);
              newWhiteCaptures += capturedPieces.length;
            }
          }

          const newMoveHistory = [...prevState.moveHistory, { 
            position: aiMove, 
            player: 'white' as Player,
            capturedPieces: capturedPieces.length > 0 ? capturedPieces : undefined
          }];
          
          setLastMove(aiMove);
          setIsThinking(false);
          
          if (checkWinner(newBoard, aiMove.row, aiMove.col, 'white')) {
            return {
              ...prevState,
              board: newBoard,
              currentPlayer: 'black',
              winner: 'white',
              isGameOver: true,
              moveHistory: newMoveHistory,
              whiteCaptures: newWhiteCaptures
            };
          } else if (prevState.gameMode === 'capture') {
            const captureWinner = checkCaptureWin(prevState.blackCaptures, newWhiteCaptures);
            if (captureWinner === 'white') {
              return {
                ...prevState,
                board: newBoard,
                currentPlayer: 'black',
                winner: 'white',
                isGameOver: true,
                moveHistory: newMoveHistory,
                whiteCaptures: newWhiteCaptures
              };
            }
          } else if (isBoardFull(newBoard)) {
            return {
              ...prevState,
              board: newBoard,
              currentPlayer: 'black',
              isGameOver: true,
              moveHistory: newMoveHistory,
              whiteCaptures: newWhiteCaptures
            };
          }

          return {
            ...prevState,
            board: newBoard,
            currentPlayer: 'black',
            moveHistory: newMoveHistory,
            whiteCaptures: newWhiteCaptures
          };
        });
      }, 500);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [gameState.currentPlayer, gameState.isGameOver]);

  const getStatusMessage = () => {
    if (gameState.winner) {
      if (gameState.gameMode === 'capture') {
        const blackCaptures = gameState.blackCaptures;
        const whiteCaptures = gameState.whiteCaptures;
        
        if (gameState.winner === 'black') {
          return blackCaptures >= CAPTURE_WIN_COUNT 
            ? `恭喜你获胜！提子数: ${blackCaptures}/${CAPTURE_WIN_COUNT}` 
            : '恭喜你获胜！';
        } else {
          return whiteCaptures >= CAPTURE_WIN_COUNT 
            ? `AI获胜了！提子数: ${whiteCaptures}/${CAPTURE_WIN_COUNT}` 
            : 'AI获胜了！';
        }
      }
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
      
      <div className="mode-selector">
        <button 
          className={`mode-button ${gameMode === 'standard' ? 'active' : ''}`}
          onClick={() => handleModeChange('standard')}
        >
          标准模式
        </button>
        <button 
          className={`mode-button ${gameMode === 'capture' ? 'active' : ''}`}
          onClick={() => handleModeChange('capture')}
        >
          连五提子
        </button>
      </div>
      
      <div className={`status-message ${gameState.winner ? (gameState.winner === 'black' ? 'winner' : 'loser') : ''}`}>
        {getStatusMessage()}
      </div>
      
      {gameState.gameMode === 'capture' && (
        <div className="capture-stats">
          <div className="capture-stat">
            <span className="capture-label">黑棋（你）</span>
            <span className="capture-count">{gameState.blackCaptures}/{CAPTURE_WIN_COUNT}</span>
          </div>
          <div className="capture-stat">
            <span className="capture-label">白棋（AI）</span>
            <span className="capture-count">{gameState.whiteCaptures}/{CAPTURE_WIN_COUNT}</span>
          </div>
        </div>
      )}
      
      <div className="board-wrapper">
        <Board
          board={gameState.board}
          onCellClick={handleCellClick}
          lastMove={lastMove}
          disabled={gameState.isGameOver || isThinking || gameState.currentPlayer !== 'black'}
        />
      </div>
      
      <div className="controls">
        <button 
          className="undo-button" 
          onClick={undoMove}
          disabled={gameState.moveHistory.length === 0 || gameState.isGameOver || isThinking}
        >
          悔棋
        </button>
        <button className="reset-button" onClick={() => resetGame()}>
          重新开始
        </button>
      </div>
      
      <div className="info">
        <p>棋盘大小：{BOARD_SIZE}x{BOARD_SIZE}</p>
        <p>游戏规则：{gameMode === 'standard' ? '五子连珠获胜' : '五子连珠或提子5颗获胜'}</p>
        <p>玩家执黑棋先行</p>
      </div>
    </div>
  );
};

export default Game;
