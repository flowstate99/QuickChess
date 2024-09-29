import React, { useState, useEffect, useRef, useCallback} from 'react';
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
    isBoardFlipped: false
  })

  const stockfishWorker = useRef(null)

  useEffect(() => {
    try {
      if (!stockfishWorker.current) {
        stockfishWorker.current = new Worker('stockfishWorker.js');
        stockfishWorker.current.postMessage('uci');
        stockfishWorker.current.postMessage('ucinewgame');
        stockfishWorker.current.postMessage(`setoption name Skill Level value ${gameState.stockfishLevel}`);
        console.log('Stockfish level set to:', gameState.stockfishLevel);
        stockfishWorker.current.onmessage = handleStockfishMessage

        if (gameState.playerColor === 'b') {
          makeStockfishMove();
        }
        console.log('Stockfish worker initialized');
        return () => {
          if (stockfishWorker.current) {
            stockfishWorker.current.terminate();
            stockfishWorker.current = null;
            console.log('Stockfish worker terminated');
          }
        }
      }
    } catch (error) {
      console.error('Error initializing Stockfish worker:', error);
    }
    // eslint-disable-next-line
  }, []);
  
  useEffect(() => {
    setGameState((prevState) => ({
      ...prevState,
      isBoardFlipped: prevState.playerColor === 'b'
    }));
  }, []);


  const updateGameState = useCallback((updates) => {
    setGameState((prevState) => ({
      ...prevState,
      ...updates,
      board: updates.game ? updates.game.board().map(row => row.map(square => square ? `${square.color}${square.type}` : '')) : prevState.board,
      isGameOver: updates.game ? updates.game.isGameOver() : prevState.isGameOver
    }))
  }, [])

  const checkGameOver = () => {
    setGameState((prevState) => ({
      ...prevState,
      isGameOver: prevState.game.isGameOver()
    }))
  };

  const handleStockfishMessage = useCallback((event) => {
    const message = event.data;
    if (typeof message === 'string') {
      if (message.startsWith('bestmove')) {
        const bestMove = message.split(' ')[1]; // Extract the move from the message
        console.log('Stockfish best move:', bestMove);
        
        if (bestMove) {
          const from = bestMove.slice(0, 2); // e.g., "e2"
          const to = bestMove.slice(2, 4);   // e.g., "e4"
  
          // Check if the move is valid for the current game state
          const newGame = new Chess(gameState.game.fen());
          
          // No promotion unless necessary
          const move = newGame.move({
            from: from,
            to: to,
            promotion: (from[1] === '7' && to[1] === '8') || (from[1] === '2' && to[1] === '1') ? 'q' : undefined // Promote to queen by default
          });
  
          if (move) {
            updateGameState({ 
              game: newGame, 
              moveHistory: [...gameState.moveHistory, move],
              currentMoveIndex: gameState.currentMoveIndex + 1,
              isPlayerTurn: true // Switch back to player's turn
            });
            console.log('Stockfish move applied:', move.san);
          } else {
            console.error('Failed to apply Stockfish move:', bestMove);
          }
        }
      }
    }
  }, [gameState.game, gameState.moveHistory, gameState.currentMoveIndex, updateGameState]);


  useEffect(() => {
    if (stockfishWorker.current) {
      stockfishWorker.current.onmessage = handleStockfishMessage
    }
  }, [handleStockfishMessage])

  useEffect(() => {
    if (!gameState.isPlayerTurn && !gameState.isGameOver) {
      setTimeout(makeStockfishMove, 1500);
    }
  })

  const makeStockfishMove = useCallback(() => {
    try {
        if (stockfishWorker.current) {
            if (typeof stockfishWorker.current.postMessage === 'function') {
                try {
                    const fen = gameState.game.fen();
                    stockfishWorker.current.postMessage(`position fen ${fen}`);
                    
                    // Adjust depth based on stockfishLevel
                    const depth = gameState.stockfishLevel * 2; // Level 1 = depth 2, Level 10 = depth 20
                    stockfishWorker.current.postMessage(`go depth ${depth}`);
                } catch (error) {
                    console.error('Error posting message to Stockfish:', error);
                }
            } else {
                console.error('postMessage is not a function on stockfishWorker.current');
            }
        } else {
            console.error('Stockfish worker is not initialized');
        }
    } catch (error) {
        console.error('Error making Stockfish move:', error);
    }
}, [gameState.game, gameState.stockfishLevel]);

const handleMove = useCallback((from, to) => {
  if (gameState.isGameOver || !gameState.isPlayerTurn) return;

  try {
    const moveDetails = {
      from: from.square,
      to: to.square,
      promotion: (from.square[1] === '7' && to.square[1] === '8') || (from.square[1] === '2' && to.square[1] === '1') ? 'q' : undefined // Promote to queen by default
    };
    const newGame = new Chess(gameState.game.fen());
    const move = newGame.move(moveDetails);
    updateGameState({
      game: newGame,
      moveHistory: [...gameState.moveHistory.slice(0, gameState.currentMoveIndex + 1), move],
      currentMoveIndex: gameState.currentMoveIndex + 1,
      error: '',
      isPlayerTurn: false
    });
    console.log('Move made:', move.san);
  } catch (error) {
    setGameState((prevState) => ({
      ...prevState,
      error: 'Invalid move. Please try again.',
    }));
  } finally {
    setGameState((prevState) => ({
      ...prevState,
      selectedPiece: null,
      draggedPiece: null,
    }));
  }
}, [gameState.isGameOver, gameState.isPlayerTurn, gameState.currentMoveIndex, gameState.game, gameState.moveHistory, updateGameState]);



  const Controls = () => {
    return (
      <div className="controls">
        <select
          value={gameState.stockfishLevel}
          onChange={(e) => updateGameState({ stockfishLevel: parseInt(e.target.value) })}
        >
          {[...Array(10)].map((_, i) => (
            <option key={i} value={i + 1}>Level {i + 1}</option>
          )
          )}
        </select>
        <button onClick={() => {
          updateGameState({
            game: new Chess(),
            moveHistory: [],
            stockfishLevel: gameState.stockfishLevel,
            currentMoveIndex: -1,
            isGameOver: false,
            isPlayerTurn: true
          })
        }}>New Game</button>
        <button
          disabled={gameState.isGameOver
          || !gameState.isPlayerTurn} onClick={() => handleResign()}>Resign</button>
        <button disabled={
          gameState.isGameOver
          || !gameState.isPlayerTurn} onClick={() => handleDrawOffer()}>Offer Draw</button>
        {gameState.currentMoveIndex > 0 && (
          <button disabled={gameState.isGameOver} onClick={() => handleTakeback()}>Take Back</button>
        )}
      </div>
    );
  };

  const handleResign = () => {
    if (gameState.isGameOver) return;
    setGameState((prevState) => ({
      ...prevState,
      isGameOver: true,
      error: 'You resigned. opponent wins!'
    }));
  };

  const handleDrawOffer = () => {
    if (gameState.isGameOver) return;
    setGameState((prevState) => ({
      ...prevState,
      isGameOver: true,
      error: 'Draw offered.'
    }));
  };

  const handleTakeback = () => {
    if (gameState.isGameOver) return;
    if (gameState.currentMoveIndex < 1) return;

    const newGame = new Chess();
    for (let i = 0; i <= gameState.currentMoveIndex - 2; i++) {
      newGame.move(gameState.moveHistory[i].san);
    }
    setGameState({
      ...gameState,
      game: newGame,
      moveHistory: gameState.moveHistory.slice(0, gameState.currentMoveIndex - 1),
      currentMoveIndex: gameState.currentMoveIndex - 2,
      board: newGame.board().map(row => row.map(square => square ? `${square.color}${square.type}` : '')),
      isPlayerTurn: true // Give turn to the requester to play
    });
  };


  const handleSquareClick = (i, j) => {
    if (gameState.isGameOver || !gameState.isPlayerTurn) return;

    const actualI = gameState.isBoardFlipped ? 7 - i : i;
    const actualJ = gameState.isBoardFlipped ? 7 - j : j;
    const clickedPiece = gameState.board[actualI][actualJ];
    const square = `${String.fromCharCode(97 + actualJ)}${8 - actualI}`;
    
    if (gameState.selectedPiece) {
      if (clickedPiece && clickedPiece[0] === gameState.game.turn()) {
        // If clicking on another piece of the same color, switch the selected piece
        setGameState((prevState) => ({
          ...prevState,
          selectedPiece: { piece: clickedPiece, i, j, square },
          error: '',
        }));
      } else {
        // Otherwise, attempt to make a move
        handleMove(gameState.selectedPiece, { i, j, square });
      }
    } else if (clickedPiece && clickedPiece[0] === gameState.game.turn()) {
      setGameState((prevState) => ({
        ...prevState,
        selectedPiece: { piece: clickedPiece, i, j, square },
        error: '',
      }));
    } else {
      setGameState((prevState) => ({
        ...prevState,
        error: 'Please select a piece to move.',
      }));
    }
  };

  const handleDragStart = (e, i, j) => {
    if (gameState.isGameOver || !gameState.isPlayerTurn) {
      e.preventDefault();
      return;
    }

    const actualI = gameState.isBoardFlipped ? 7 - i : i;
    const actualJ = gameState.isBoardFlipped ? 7 - j : j;
    const piece = gameState.board[actualI][actualJ];
    if (piece && piece[0] === gameState.game.turn()) {
      setGameState((prevState) => ({
        ...prevState,
        draggedPiece: { piece, i: actualI, j: actualJ, square: `${String.fromCharCode(97 + actualJ)}${8 - actualI}` },
        error: '',
      }));
    } else {
      e.preventDefault();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, i, j) => {
    e.preventDefault();
    if (gameState.isGameOver || !gameState.isPlayerTurn) return;

    if (gameState.draggedPiece) {
      const actualI = gameState.isBoardFlipped ? 7 - i : i;
      const actualJ = gameState.isBoardFlipped ? 7 - j : j;
      const to = { i: actualI, j:actualJ, square: `${String.fromCharCode(97 + actualJ)}${8 - actualI}` };
      handleMove(gameState.draggedPiece, to);
    }
  };

  const createBoard = () => {
    let boardToRender = gameState.board;
    if (gameState.isBoardFlipped) {
      boardToRender = [...boardToRender].reverse().map(row => [...row].reverse());
    }
    return boardToRender.map((row, i) => (
      <div key={i} className="row">
        {row.map((piece, j) => (
          <div
            key={`${i}-${j}`}
            className={`square ${(i + j) % 2 === 0 ? 'white' : 'black'} ${gameState.selectedPiece && gameState.selectedPiece.i === i && gameState.selectedPiece.j === j ? 'selected' : ''}`}
            onClick={() => handleSquareClick(i, j)}
            onDragOver={handleDragOver}
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
        ))}
      </div>
    ));
  };

  const moveToStart = () => {
    if (gameState.currentMoveIndex === -1) return;
    const newGame = new Chess();
    setGameState((prevState) => ({
      ...prevState,
      game: newGame,
      board: initialBoard,
      selectedPiece: null,
      currentMoveIndex: -1,
      error: '',
      draggedPiece: null,
      isGameOver: false,
      isPlayerTurn: true
    }));
  };

  const moveToPrevious = () => {
    if (gameState.currentMoveIndex >= 0) {
      const newGame = new Chess();
      for (let i = 0; i < gameState.currentMoveIndex; i++) {
        newGame.move(gameState.moveHistory[i].san);
      }
      setGameState((prevState) => ({
        ...prevState,
        game: newGame,
        currentMoveIndex: prevState.currentMoveIndex - 1,
        board: newGame.board().map(row => row.map(square => square ? `${square.color}${square.type}` : ''))
      }));
      checkGameOver();
    }
  };

  const moveToNext = () => {
    if (gameState.currentMoveIndex < gameState.moveHistory.length - 1) {
      const newGame = new Chess();
      for (let i = 0; i <= gameState.currentMoveIndex + 1; i++) {
        newGame.move(gameState.moveHistory[i].san);
      }
      setGameState((prevState) => ({
        ...prevState,
        game: newGame,
        currentMoveIndex: prevState.currentMoveIndex + 1,
        board: newGame.board().map(row => row.map(square => square ? `${square.color}${square.type}` : ''))
      }));
      checkGameOver();
    }
  };

  const moveToEnd = () => {
    if (gameState.currentMoveIndex === gameState.moveHistory.length - 1) return;
    const newGame = new Chess();
    for (let i = 0; i < gameState.moveHistory.length; i++) {
      newGame.move(gameState.moveHistory[i].san);
    }
    setGameState({
      ...gameState,
      game: newGame,
      currentMoveIndex: gameState.moveHistory.length - 1,
      board: newGame.board().map(row => row.map(square => square ? `${square.color}${square.type}` : ''))
    });
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
        {gameState.error && <div className="error-message">{gameState.error}</div>}
        {gameState.isGameOver && <div className="game-over-message">Game Over</div>}
        <div className='player-info'>
          You are playing as {gameState.playerColor === 'w' ? 'White' : 'Black'}
          </div>
        <div className="move-history">
          <div className="move-navigation">
            <button onClick={moveToStart} disabled={gameState.currentMoveIndex === -1}>{'<<'}</button>
            <button onClick={moveToPrevious} disabled={gameState.currentMoveIndex === -1}>{'<'}</button>
            <button onClick={moveToNext} disabled={gameState.currentMoveIndex === gameState.moveHistory.length - 1}>{'>'}</button>
            <button onClick={moveToEnd} disabled={gameState.currentMoveIndex === gameState.moveHistory.length - 1}>{'>>'}</button>
          </div>
          {Array.from({ length: Math.ceil(gameState.moveHistory.length / 2) }, (_, i) => (
            <div key={i} className="move-pair">
              <span className="move-number">{i + 1}.</span>
              <span 
                className={`move white-move ${2 * i === gameState.currentMoveIndex ? 'current-move' : ''}`}
                onClick={() => {
                  const newGame = new Chess();
                  for (let j = 0; j <= 2 * i; j++) {
                    newGame.move(gameState.moveHistory[j].san);
                  }
                  setGameState({
                    ...gameState,
                    game: newGame,
                    currentMoveIndex: 2 * i
                  });
                  checkGameOver();
                }}
              >
                {renderPiece(gameState.moveHistory[2 * i]?.piece)}
                {gameState.moveHistory[2 * i]?.san}
              </span>
              {gameState.moveHistory[2 * i + 1] && (
                <span 
                  className={`move black-move ${2 * i + 1 === gameState.currentMoveIndex ? 'current-move' : ''}`}
                  onClick={() => {
                    const newGame = new Chess();
                    for (let j = 0; j <= 2 * i + 1; j++) {
                      newGame.move(gameState.moveHistory[j].san);
                    }
                    setGameState({
                      ...gameState,
                      game: newGame,
                      currentMoveIndex: 2 * i + 1
                    });
                    checkGameOver();
                  }}
                >
                  {renderPiece(gameState.moveHistory[2 * i + 1]?.piece)}
                  {gameState.moveHistory[2 * i + 1]?.san}
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