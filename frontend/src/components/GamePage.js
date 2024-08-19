// src/components/GamePage.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Chessboard from 'chessboardjsx';
import io from 'socket.io-client';
import { Chess } from 'chess.js';
import '../App.css';

const socket = io('http://localhost:1337');
const chess = new Chess();

const GamePage = () => {
  const { id } = useParams();
  const [position, setPosition] = useState(chess.fen());

  useEffect(() => {
    socket.emit('joinGame', id);

    socket.on('moveMade', (move) => {
      chess.move(move);
      setPosition(chess.fen());
    });

    socket.on('connection', () => {
      console.log('connected to the server');
    });

    socket.on('disconnect', () => {
      console.log('disconnected from server');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('moveMade');
    };
  }, [id]);

  const handleMove = async (move) => {
    const from = move.sourceSquare;
    const to = move.targetSquare;
    const moveObj = { from, to };

    const validMove = chess.move(moveObj);
    if (validMove) {
      setPosition(chess.fen());
      socket.emit('makeMove', { gameId: id, move: moveObj });

      // Send the move to the backend to get Stockfish's response
      try {
        const response = await axios.post('http://localhost:1337/api/ai/move', { position: chess.fen() });
        const bestMove = response.data.bestMove;

        chess.move(bestMove);
        setPosition(chess.fen());
      } catch (error) {
        console.error('Error fetching best move:', error);
      }
    }
  };

  return (
    <div className="container">
      <h1>Game Page</h1>
      <Chessboard
        position={position}
        onDrop={(move) => handleMove(move)}
      />
    </div>
  );
};

export default GamePage;
