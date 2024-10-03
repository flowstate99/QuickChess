import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import './Chessboard.css';
import MoveDisplay from './MoveDisplay';

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
  const [gameState, setGameState] = useState({
    game: new Chess(),
    board: initialBoard,
    selectedPiece: null,
    moveHistory: [],
    currentMoveIndex: -1,
    error: '',
    draggedPiece: null,
    isGameOver: false,
    stockfishLevel: 1,
    isPlayerTurn: true,
    playerColor: Math.random() < 0.5 ? 'w' : 'b',
    isBoardFlipped: false,
    isGameStarted: false,
    isThreeFoldRepetition: false,
    validMoves: [],
    positionHistory: [],
    lastMove: null
  });

  const stockfishWorker = useRef(null);


  const updateGameState = useCallback((updates) => {
    setGameState(prev => ({
      ...prev,
      ...updates,
      board: updates.game ? updates.game.board().map(row => row.map(square => square ? `${square.color}${square.type}` : '')) : prev.board,
      isGameOver: updates.game ? updates.game.isGameOver() : prev.isGameOver
    }));
  }, []);

  const handleStockfishMessage = useCallback((event) => {
    const message = event.data;
    if (typeof message === 'string' && message.startsWith('bestmove')) {
      const [from, to] = message.split(' ')[1].match(/.{1,2}/g);
      const newGame = new Chess(gameState.game.fen());
      try {
        const move = newGame.move({ from, to, promotion: 'q' });
        const newPosition = newGame.fen().split(' ').slice(0, 4).join(' ');
        const newPositionHistory = [...gameState.positionHistory, newPosition];
        if (move) {
          updateGameState({ 
            game: newGame, 
            moveHistory: [...gameState.moveHistory, move],
            currentMoveIndex: gameState.currentMoveIndex + 1,
            positionHistory: newPositionHistory,
            isPlayerTurn: true,
            lastMove: { from, to }
          });
        }
      } catch (error) {
        console.error('Error applying Stockfish move:', error.message);
      }
    }
  }, [gameState, updateGameState]);

  useEffect(() => {
    try {
      stockfishWorker.current = new Worker('stockfishWorker.js');
      stockfishWorker.current.postMessage('uci');
      stockfishWorker.current.postMessage('ucinewgame');
      stockfishWorker.current.postMessage(`setoption name Skill Level value ${gameState.stockfishLevel}`);
      stockfishWorker.current.postMessage(`setoption name Skill Level Maximum Error value ${1000 - gameState.stockfishLevel*50}`);
      stockfishWorker.current.postMessage(`setOption name Skill Level Probability value ${180 - gameState.stockfishLevel * 10}`);
      stockfishWorker.current.postMessage('go movetime 1500');
      stockfishWorker.current.onmessage = handleStockfishMessage;
    } catch (error) {
      console.error('Error initializing Stockfish worker:', error);
    }
    return () => stockfishWorker.current?.terminate();
  }, [gameState.stockfishLevel, handleStockfishMessage]);

  useEffect(() => {
    setGameState(prev => ({ ...prev, isBoardFlipped: prev.playerColor === 'b' }));
  }, []);

  const makeStockfishMove = useCallback(() => {
    const fen = gameState.game.fen();
    const depth = gameState.stockfishLevel;
    stockfishWorker.current?.postMessage(`position fen ${fen}`);
    stockfishWorker.current?.postMessage(`go depth ${depth}`);
  }, [gameState.game, gameState.stockfishLevel]);

  useEffect(() => {
    if (!gameState.isPlayerTurn && !gameState.isGameOver) {
      setTimeout(makeStockfishMove, 1500);
    }
  }, [gameState.isPlayerTurn, gameState.isGameOver, makeStockfishMove]);

  const handleNewGame = () => {
    const newPlayerColor = Math.random() < 0.5 ? 'w' : 'b';
    updateGameState({
      game: new Chess(),
      board: initialBoard,
      moveHistory: [],
      currentMoveIndex: -1,
      error: '',
      draggedPiece: null,
      isGameOver: false,
      isPlayerTurn: newPlayerColor === 'w',
      playerColor: newPlayerColor,
      isBoardFlipped: newPlayerColor === 'b',
      isGameStarted: true,
      lastMove: null,
      positionHistory: [],
      isThreeFoldRepetition: false
    });
    if (newPlayerColor === 'b') setTimeout(makeStockfishMove, 1500);
  };

  const handleMove = useCallback((from, to) => {
    if (gameState.isGameOver || !gameState.isPlayerTurn || !gameState.isGameStarted) return;
    try {
      const newGame = new Chess(gameState.game.fen());
      const move = newGame.move({
        from: from.square,
        to: to.square,
        promotion: 'q'
      });
      const newMoveHistory = [...gameState.moveHistory.slice(0, gameState.currentMoveIndex + 1), move];
      const newPosition = newGame.fen().split(' ').slice(0, 4).join(' ');
      const newPositionHistory = [...gameState.positionHistory, newPosition];
      updateGameState({
        game: newGame,
        moveHistory: newMoveHistory,
        currentMoveIndex: gameState.currentMoveIndex + 1,
        error: '',
        isPlayerTurn: false,
        lastMove: { from: from.square, to: to.square },
        validMoves: [],
        positionHistory: newPositionHistory,
        selectedPiece: null,
        draggedPiece: null
      });
    } catch (error) {
      setGameState(prev => ({ ...prev, error: 'Invalid move. Please try again.' }));
    }
  }, [gameState, updateGameState]);

  const getValidMoves = useCallback((square) => 
    gameState.game.moves({ square, verbose: true }).map(move => move.to),
  [gameState.game]);

  const handleSquareClick = (i, j) => {
    if (gameState.isGameOver || !gameState.isPlayerTurn) return;
    const [actualI, actualJ] = gameState.isBoardFlipped ? [7 - i, 7 - j] : [i, j];
    const clickedPiece = gameState.board[actualI][actualJ];
    const square = `${String.fromCharCode(97 + actualJ)}${8 - actualI}`;
    
    if (gameState.selectedPiece) {
      if (clickedPiece && clickedPiece[0] === gameState.game.turn()) {
        setGameState(prev => ({
          ...prev,
          selectedPiece: { piece: clickedPiece, i: actualI, j: actualJ, square },
          error: '',
          validMoves: getValidMoves(square)
        }));
      } else {
        handleMove(gameState.selectedPiece, { i: actualI, j: actualJ, square });
      }
    } else if (clickedPiece && clickedPiece[0] === gameState.game.turn()) {
      setGameState(prev => ({
        ...prev,
        selectedPiece: { piece: clickedPiece, i: actualI, j: actualJ, square },
        validMoves: getValidMoves(square),
        error: '',
      }));
    } else {
      setGameState(prev => ({ ...prev, error: 'Please select a piece to move.', validMoves: [] }));
    }
  };

  const handleDragStart = (e, i, j) => {
    if (gameState.isGameOver || !gameState.isPlayerTurn) {
      e.preventDefault();
      return;
    }
    const [actualI, actualJ] = gameState.isBoardFlipped ? [7 - i, 7 - j] : [i, j];
    const piece = gameState.board[actualI][actualJ];
    const square = `${String.fromCharCode(97 + actualJ)}${8 - actualI}`;
    if (piece && piece[0] === gameState.game.turn()) {
      setGameState(prev => ({
        ...prev,
        draggedPiece: { piece, i: actualI, j: actualJ, square },
        validMoves: getValidMoves(square),
        error: '',
      }));
    } else {
      e.preventDefault();
    }
  };

  const handleDrop = (e, i, j) => {
    e.preventDefault();
    if (gameState.isGameOver || !gameState.isPlayerTurn || !gameState.draggedPiece) return;
    const [actualI, actualJ] = gameState.isBoardFlipped ? [7 - i, 7 - j] : [i, j];
    const to = { i: actualI, j: actualJ, square: `${String.fromCharCode(97 + actualJ)}${8 - actualI}` };
    if (gameState.draggedPiece.i === actualI && gameState.draggedPiece.j === actualJ) {
      setGameState(prev => ({ ...prev, validMoves: [], draggedPiece: null }));
    } else {
      handleMove(gameState.draggedPiece, to);
    }
  };

  const createBoard = () => {
    let boardToRender = gameState.isBoardFlipped ? 
      [...gameState.board].reverse().map(row => [...row].reverse()) : 
      gameState.board;
    return boardToRender.map((row, i) => (
      <div key={i} className="row">
        {row.map((piece, j) => {
          const [actualI, actualJ] = gameState.isBoardFlipped ? [7 - i, 7 - j] : [i, j];
          const square = `${String.fromCharCode(97 + actualJ)}${8 - actualI}`;
          const isLastMoveSquare = gameState.lastMove && (gameState.lastMove.from === square || gameState.lastMove.to === square);
          const isValidMove = gameState.validMoves.includes(square);
          return (
            <div
              key={`${i}-${j}`}
              className={`square ${(i + j) % 2 === 0 ? 'white' : 'black'} 
                ${gameState.selectedPiece && gameState.selectedPiece.i === actualI && gameState.selectedPiece.j === actualJ ? 'selected' : ''}
                ${isLastMoveSquare ? 'highlight' : ''}
                ${isValidMove ? 'valid-move' : ''}`}
              onClick={() => handleSquareClick(i, j)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, i, j)}
            >
              {piece && (
                <img
                  src={`images/${piece}.png`}
                  alt={piece}
                  draggable={!gameState.isGameOver}
                  onDragStart={(e) => handleDragStart(e, i, j)}
                />
              )}
            </div>
          );
        })}
      </div>
    ));
  };

  const moveToPosition = (index) => {
    const newGame = new Chess();
    for (let i = 0; i <= index; i++) {
      newGame.move(gameState.moveHistory[i].san);
    }
    const lastMove = gameState.moveHistory[index];
    setGameState(prev => ({
      ...prev,
      game: newGame,
      currentMoveIndex: index,
      lastMove: lastMove ? { from: lastMove.from, to: lastMove.to } : null,
      board: newGame.board().map(row => row.map(square => square ? `${square.color}${square.type}` : ''))
    }));
  };

  return (
    <div className='container'>
      <div className="chessboard">{createBoard()}</div>
      <div className='right-panel'>
        <div className="controls">
          <div className="new-game">
            <select
              value={gameState.stockfishLevel}
              onChange={(e) => updateGameState({ stockfishLevel: parseInt(e.target.value) })}
            >
              {[...Array(12)].map((_, i) => (
                <option key={i} value={i + 1}>Level {i + 1}</option>
              ))}
            </select>
            <button onClick={handleNewGame}>New Game</button>
          </div>
          <div className='game-decisions'>
          <button 
            disabled={gameState.isGameOver || !gameState.isPlayerTurn} 
            onClick={() => setGameState(prev => ({ ...prev, isGameOver: true, error: 'You resigned. Opponent wins!' }))}
          >
            Resign
          </button>
          <button 
            disabled={gameState.isGameOver || !gameState.isPlayerTurn}
            onClick={() => setGameState(prev => ({ ...prev, isGameOver: true, error: 'Draw offered.' }))}
          >
            Offer Draw
          </button>
          {gameState.currentMoveIndex > 0 && (
            <button 
              disabled={gameState.isGameOver} 
              onClick={() => moveToPosition(gameState.currentMoveIndex - 2)}
            >
              Take Back
            </button>
            )}
            </div>
        </div>
        {gameState.error && <div className="error-message">{gameState.error}</div>}
        {!gameState.isGameStarted && <div className="game-start-message">Click New Game to start</div>}
        {gameState.isGameOver && <div className="game-over-message">Game Over</div>}
          <div className="move-history">
          <div className="move-navigation">
            <button onClick={() => moveToPosition(-1)} disabled={gameState.currentMoveIndex === -1}>{'<<'}</button>
            <button onClick={() => moveToPosition(Math.max(-1, gameState.currentMoveIndex - 1))} disabled={gameState.currentMoveIndex === -1}>{'<'}</button>
            <button onClick={() => moveToPosition(Math.min(gameState.moveHistory.length - 1, gameState.currentMoveIndex + 1))} disabled={gameState.currentMoveIndex === gameState.moveHistory.length - 1}>{'>'}</button>
            <button onClick={() => moveToPosition(gameState.moveHistory.length - 1)} disabled={gameState.currentMoveIndex === gameState.moveHistory.length - 1}>{'>>'}</button>
          </div>
          {Array.from({ length: Math.ceil(gameState.moveHistory.length / 2) }, (_, i) => (
            <div key={i} className="move-pair">
              <span className="move-number">{i + 1}.</span>
              <MoveDisplay
                move={gameState.moveHistory[2 * i]}
                index={2 * i}
                currentIndex={gameState.currentMoveIndex}
                onMoveClick={() => moveToPosition(2 * i)}
              />
              {gameState.moveHistory[2 * i + 1] && (
                <MoveDisplay
                  move={gameState.moveHistory[2 * i + 1]}
                  index={2 * i + 1}
                  currentIndex={gameState.currentMoveIndex}
                  onMoveClick={() => moveToPosition(2 * i + 1)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Chessboard;