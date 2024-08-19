import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const HomePage = () => {
  const [friends, setFriends] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setFriends(['Alice', 'Bob', 'Charlie']);
    setMatchHistory([
      { opponent: 'Alice', result: 'Win' },
      { opponent: 'Bob', result: 'Loss' },
      { opponent: 'Charlie', result: 'Draw' },
    ]);
  }, []);

  const handleQueueUp = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/games', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });
      navigate(`/game/${response.data._id}`);
    } catch (error) {
      console.error('Error queueing up:', error);
    }
  };

  const handlePlayVsStockfish = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/games/stockfish', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });
      navigate(`/game/${response.data._id}`);
    } catch (error) {
      console.error('Cannot start game vs stockfish:', error);
    }
  };

  return (
    <div className="container">
      <h1>Home Page</h1>
      <div className="section">
        <h2>Friend List</h2>
        <div className="list">
          {friends.map((friend, index) => (
            <div key={index} className="list-item">
              {friend}
            </div>
          ))}
        </div>
      </div>
      <div className="section">
        <h2>Match History</h2>
        <div className="list">
          {matchHistory.map((match, index) => (
            <div key={index} className="list-item">
              {match.opponent} - {match.result}
            </div>
          ))}
        </div>
      </div>
      <button onClick={handlePlayVsStockfish}>Play vs stockfish</button>
      <button onClick={handleQueueUp}>Queue Up for a Game</button>
    </div>
  );
};

export default HomePage;