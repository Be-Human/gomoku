import React from 'react';
import type { Board as BoardType } from '../types';
import { BOARD_SIZE } from '../gameLogic';
import './Board.css';

interface BoardProps {
  board: BoardType;
  onCellClick: (row: number, col: number) => void;
  lastMove: { row: number; col: number } | null;
  disabled: boolean;
}

const Board: React.FC<BoardProps> = ({ board, onCellClick, lastMove, disabled }) => {
  const cellSize = 30;
  const boardSize = cellSize * (BOARD_SIZE - 1);
  const padding = 20;
  const totalSize = boardSize + padding * 2;

  const renderPieces = () => {
    const pieces = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const cell = board[row][col];
        if (cell !== null) {
          const isLastMove = lastMove && lastMove.row === row && lastMove.col === col;
          pieces.push(
            <div
              key={`${row}-${col}`}
              className={`piece ${cell} ${isLastMove ? 'last-move' : ''}`}
              style={{
                left: padding + col * cellSize - 13,
                top: padding + row * cellSize - 13,
              }}
            />
          );
        }
      }
    }
    return pieces;
  };

  const renderStarPoints = () => {
    const starPoints = [
      [3, 3], [3, 7], [3, 11],
      [7, 3], [7, 7], [7, 11],
      [11, 3], [11, 7], [11, 11]
    ];

    return starPoints.map(([row, col]) => (
      <div
        key={`star-${row}-${col}`}
        className="star-point"
        style={{
          left: padding + col * cellSize - 4,
          top: padding + row * cellSize - 4,
        }}
      />
    ));
  };

  const renderClickAreas = () => {
    const areas = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        areas.push(
          <div
            key={`click-${row}-${col}`}
            className={`click-area ${disabled ? 'disabled' : ''}`}
            style={{
              left: padding + col * cellSize - 15,
              top: padding + row * cellSize - 15,
            }}
            onClick={() => !disabled && onCellClick(row, col)}
          />
        );
      }
    }
    return areas;
  };

  return (
    <div className="board-container" style={{ width: totalSize, height: totalSize }}>
      <svg className="board-grid" width={totalSize} height={totalSize}>
        {/* 水平线 */}
        {Array.from({ length: BOARD_SIZE }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1={padding}
            y1={padding + i * cellSize}
            x2={padding + boardSize}
            y2={padding + i * cellSize}
            stroke="#000"
            strokeWidth="1"
          />
        ))}
        {/* 垂直线 */}
        {Array.from({ length: BOARD_SIZE }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={padding + i * cellSize}
            y1={padding}
            x2={padding + i * cellSize}
            y2={padding + boardSize}
            stroke="#000"
            strokeWidth="1"
          />
        ))}
      </svg>
      {renderStarPoints()}
      {renderPieces()}
      {renderClickAreas()}
    </div>
  );
};

export default Board;
