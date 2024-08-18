import React, { useState, useEffect } from 'react';
import Square from './square';
import axios from 'axios';
import io from 'socket.io-client'
import './chessboard.css';

const socket = io("http://localhost:1337")

function Chessboard() {
  const [gameId, setGameId] = useState(null);
  const [board, setBoard] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState('white');
  const [gameStatus, setGameStatus] = useState('ongoing');
  const [winner, setWinner] = useState(null);
  const [playerColor, setPlayerColor] = useState(null)

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to the server', socket.id);
      socket.emit('joinGame');
    });

    socket.on('waitingForOpponent', () => {
      console.log('waiting for opponent...');
    });

    socket.on('gameStarted', ({ gameId, color }) => {
      console.log(`Game started! You are playing as ${color}. game ID: ${gameId}`);
      setGameId(gameId);
      setPlayerColor(color);
      fetchGameState(gameId);
    });

    socket.on('moveMade', ({ from, to, board }) => {
      console.log(`Move made from ${from.row}, ${from.col} to ${to.row}, ${to.col}`);
      setBoard(board);
      setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
      setSelectedSquare(null);
    });

    return () => {
      socket.off('connect');
      socket.off('waitingForOpponent');
      socket.off('gameStarted');
      socket.off('moveMade');
    };
  }, [currentPlayer]);

  useEffect(() => {
    createNewGame();
  }, );
  async function createNewGame() {
    try {
        const response = await axios.post('http://localhost:1337/game');
        setGameId(response.data.gameId);
        fetchGameState(response.data.gameId);
    } catch (error) {
        console.error('Error creating new game:', error);
    }
  }

  async function fetchGameState(id) {
    try {
      const response = await axios.get(`http://localhost:1337/game/${id}`);
      setBoard(response.data.board);
      setCurrentPlayer(response.data.currentPlayer);
      setGameStatus(response.data.status);
      setWinner(response.data.winner);
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  }

  async function handleMove(from, to) {
    try {
      const response = await axios.post(`http://localhost:1337/game/${gameId}/move`, { from, to });
      setBoard(response.data.board);
      setCurrentPlayer(response.data.currentPlayer);
      setGameStatus(response.data.status);
      setWinner(response.data.winner);
      setSelectedSquare(null);
    } catch (error) {
      console.error('Error making move:', error);
    }
  }

  function handleSquareClick(row, col) {
    if (selectedSquare) {
      handleMove(selectedSquare, { row, col });
    } else {
      const piece = board[row][col];
      if (piece && (currentPlayer === 'white' ? piece === piece.toUpperCase() : piece === piece.toLowerCase())) {
          setSelectedSquare({ row, col });
      }
    }
  }

  function flipBoard() {
    return board.map(row => [...row].reverse()).reverse()
  }

  const displayedBoard = playerColor === 'black' ? flipBoard(board) : board

  useEffect(() => {
    console.log(`Player color: ${playerColor}`);
    console.log('Displayed board:', displayedBoard);
  }, [playerColor, displayedBoard]);

  if (!board) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="chessboard">
        {displayedBoard.map((row, rowIndex) => (
          row.map((piece, colIndex) => (
            <Square
              key={`${rowIndex}-${colIndex}`}
              piece={piece}
              isLight={(rowIndex + colIndex) % 2 === 0}
              isSelected={selectedSquare && selectedSquare.row === rowIndex && selectedSquare.col === colIndex}
              onClick={() => handleSquareClick(rowIndex, colIndex)}
            />
          ))
        ))}
      </div>
      <div className="game-info">
        <p>Current turn: {currentPlayer}</p>
        <p>Game status: {gameStatus}</p>
        {winner && <p>Winner: {winner}</p>}
      </div>
    </div>
  );
}

export default Chessboard;