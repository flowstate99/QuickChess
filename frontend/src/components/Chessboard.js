// Chessboard.js
import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import './Chessboard.css';

const initialBoard = [
  ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
  ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
  ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr'],
];

const Chessboard = () => {
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState(initialBoard);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [error, setError] = useState('');
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    updateBoard();
    checkGameOver();
  }, [game]);

  const Controls = () => {
    return (
      <div className="controls">
        <select>
          <option value="level1">Level 1</option>
          <option value="level2">Level 2</option>
          <option value="level3">Level 3</option>
          <option value="level4">Level 4</option>
          <option value="level5">Level 5</option>
          <option value="level6">Level 6</option>
          <option value="level7">Level 7</option>
          <option value="level8">Level 8</option>
          <option value="level9">Level 9</option>
          <option value="level10">Level 10</option>
        </select>
        <button>New Game</button>
      </div>
    );
  };

  const updateBoard = () => {
    setBoard(game.board().map(row => row.map(square => square ? `${square.color}${square.type}` : '')));
  };

  const checkGameOver = () => {
    setIsGameOver(game.isGameOver());
  };

  const handleMove = (from, to) => {
    if (isGameOver) return;

    const currentTurn = game.turn();
    try {
      if (currentTurn === board[from.i][from.j][0]) {
        const moveDetails = { from: from.square, to: to.square };
        
        // Always promote to queen
        if (currentTurn === 'w' && to.i === 0 && board[from.i][from.j][1] === 'p') {
          moveDetails.promotion = 'q';
        } else if (currentTurn === 'b' && to.i === 7 && board[from.i][from.j][1] === 'p') {
          moveDetails.promotion = 'q';
        }

        let move = game.move(moveDetails);
        setGame(new Chess(game.fen()));
        setMoveHistory([...moveHistory.slice(0, currentMoveIndex + 1), move]);
        setCurrentMoveIndex(currentMoveIndex + 1);
        setError('');
      } else {
        setError("It's not your turn.");
      }
    } catch (error) {
      setError('Invalid move. Please try again.');
    } finally {
      setSelectedPiece(null);
      setDraggedPiece(null);
    }
  };

  const handleSquareClick = (i, j) => {
    if (isGameOver) return;

    const clickedPiece = board[i][j];
    const square = `${String.fromCharCode(97 + j)}${8 - i}`;
    
    if (selectedPiece) {
      if (clickedPiece && clickedPiece[0] === game.turn()) {
        // If clicking on another piece of the same color, switch the selected piece
        setSelectedPiece({ piece: clickedPiece, i, j, square });
        setError('');
      } else {
        // Otherwise, attempt to make a move
        handleMove(selectedPiece, { i, j, square });
      }
    } else if (clickedPiece && clickedPiece[0] === game.turn()) {
      setSelectedPiece({ piece: clickedPiece, i, j, square });
      setError('');
    } else {
      setError("You can only move your own pieces on your turn.");
    }
  };

  const handleDragStart = (e, i, j) => {
    if (isGameOver) {
      e.preventDefault();
      return;
    }

    const piece = board[i][j];
    if (piece && piece[0] === game.turn()) {
      setDraggedPiece({ piece, i, j, square: `${String.fromCharCode(97 + j)}${8 - i}` });
    } else {
      e.preventDefault();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, i, j) => {
    e.preventDefault();
    if (isGameOver) return;

    if (draggedPiece) {
      const to = { i, j, square: `${String.fromCharCode(97 + j)}${8 - i}` };
      handleMove(draggedPiece, to);
    }
  };

  const createBoard = () => {
    return board.map((row, i) => (
      <div key={i} className="row">
        {row.map((piece, j) => (
          <div
            key={`${i}-${j}`}
            className={`square ${(i + j) % 2 === 0 ? 'white' : 'black'} ${selectedPiece && selectedPiece.i === i && selectedPiece.j === j ? 'selected' : ''}`}
            onClick={() => handleSquareClick(i, j)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, i, j)}
          >
            {piece && (
              <img
                src={`images/${piece}.png`}
                alt={piece}
                draggable={!isGameOver}
                onDragStart={(e) => handleDragStart(e, i, j)}
              />
            )}
          </div>
        ))}
      </div>
    ));
  };

  const moveToStart = () => {
    const newGame = new Chess();
    setGame(newGame);
    setCurrentMoveIndex(-1);
    setIsGameOver(false);
  };

  const moveToPrevious = () => {
    if (currentMoveIndex > -1) {
      const newGame = new Chess();
      for (let i = 0; i < currentMoveIndex; i++) {
        newGame.move(moveHistory[i].san);
      }
      setGame(newGame);
      setCurrentMoveIndex(currentMoveIndex - 1);
      setIsGameOver(false);
    }
  };

  const moveToNext = () => {
    if (currentMoveIndex < moveHistory.length - 1) {
      const newGame = new Chess();
      for (let i = 0; i <= currentMoveIndex + 1; i++) {
        newGame.move(moveHistory[i].san);
      }
      setGame(newGame);
      setCurrentMoveIndex(currentMoveIndex + 1);
      checkGameOver();
    }
  };

  const moveToEnd = () => {
    const newGame = new Chess();
    moveHistory.forEach(move => newGame.move(move.san));
    setGame(newGame);
    setCurrentMoveIndex(moveHistory.length - 1);
    checkGameOver();
  };

  const renderPiece = (piece) => {
    const pieceSymbols = {
      'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙',
      'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟'
    };
    return pieceSymbols[piece] || '';
  };

  return (
    <>
      <div className="chessboard">{createBoard()}</div>
      <div className='right-panel'>
        <div className="controls">{Controls()}</div>
        {error && <div className="error-message">{error}</div>}
        {isGameOver && <div className="game-over-message">Game Over</div>}
        <div className="move-history">
          <div className="move-navigation">
            <button onClick={moveToStart} disabled={currentMoveIndex === -1}>{'<<'}</button>
            <button onClick={moveToPrevious} disabled={currentMoveIndex === -1}>{'<'}</button>
            <button onClick={moveToNext} disabled={currentMoveIndex === moveHistory.length - 1}>{'>'}</button>
            <button onClick={moveToEnd} disabled={currentMoveIndex === moveHistory.length - 1}>{'>>'}</button>
          </div>
          {Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => (
            <div key={i} className="move-pair">
              <span className="move-number">{i + 1}.</span>
              <span 
                className={`move white-move ${2 * i === currentMoveIndex ? 'current-move' : ''}`}
                onClick={() => {
                  const newGame = new Chess();
                  for (let j = 0; j <= 2 * i; j++) {
                    newGame.move(moveHistory[j].san);
                  }
                  setGame(newGame);
                  setCurrentMoveIndex(2 * i);
                  setIsGameOver(false);
                }}
              >
                {renderPiece(moveHistory[2 * i]?.piece)}
                {moveHistory[2 * i]?.san}
              </span>
              {moveHistory[2 * i + 1] && (
                <span 
                  className={`move black-move ${2 * i + 1 === currentMoveIndex ? 'current-move' : ''}`}
                  onClick={() => {
                    const newGame = new Chess();
                    for (let j = 0; j <= 2 * i + 1; j++) {
                      newGame.move(moveHistory[j].san);
                    }
                    setGame(newGame);
                    setCurrentMoveIndex(2 * i + 1);
                    checkGameOver();
                  }}
                >
                  {renderPiece(moveHistory[2 * i + 1]?.piece)}
                  {moveHistory[2 * i + 1]?.san}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
};

export default Chessboard;
