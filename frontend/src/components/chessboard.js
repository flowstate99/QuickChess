import React, { useState, useEffect } from 'react';
import Square from './square';
import axios from 'axios';
import './chessboard.css';

function Chessboard() {
    const [gameId, setGameId] = useState(null);
    const [board, setBoard] = useState(null);
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState('white');
    const [gameStatus, setGameStatus] = useState('ongoing');
    const [winner, setWinner] = useState(null);

    useEffect(() => {
        // Create a new game when the component mounts
        createNewGame();
    });

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
            // Optionally, you can show an error message to the user here
        }
    }

    function handleSquareClick(row, col) {
        if (selectedSquare) {
            // If a square was already selected, try to make a move
            handleMove(selectedSquare, { row, col });
        } else {
            // If no square was selected, select this square if it has a piece of the current player
            const piece = board[row][col];
            if (piece && (currentPlayer === 'white' ? piece === piece.toUpperCase() : piece === piece.toLowerCase())) {
                setSelectedSquare({ row, col });
            }
        }
    }

    if (!board) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div className="chessboard">
                {board.map((row, rowIndex) => (
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