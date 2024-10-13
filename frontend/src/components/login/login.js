import React, { useState } from 'react';
import Chessboard from '../chessboard/Chessboard';
import './login.css';

function Login({ onLogin, darkMode }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data);
      } else {
        if (data.error === 'User does not exist') {
          alert('User does not exist. Please register.');
        }
        else if (data.error === 'Incorrect password') {
          alert('Incorrect password. Please try again.');
        }
        else {
          alert(data.error || 'An error occurred');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data);
      } else {
        if (data.error === 'User already exists') {
          alert('User already exists. Please login.');
        } else {
          alert(data.error || 'An error occurred');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className={`login-landing-page ${darkMode ? 'dark' : 'light'}`}>
      <div className='login-container'>
        <div className='login-image'>
          <img src='/quickChess.png' alt='QuickChess'></img>
        </div>
        <div className='auth-form'>
          <div className='inputs'>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
            />
          </div>
          <div className='login-buttons'>
            <button onClick={handleLogin} className="login-button">Login</button>
            <button onClick={handleRegister} className="login-button">Register</button>
          </div>
        </div>
      </div>
      <h1> Try playing vs StockFish</h1>
      <Chessboard />
    </div>
  );
}

export default Login;