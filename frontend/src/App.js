import React, { useState, useEffect } from 'react';
import './App.css';
import Chessboard from './components/Chessboard';

function App() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="App">
      <nav className="navbar">
        <h1 className="website-title">QuickChess</h1>
        <div className="dark-mode-container">
          <label className="dark-mode-label">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={toggleDarkMode}
              className="dark-mode-checkbox"
            />
            <span className="dark-mode-slider"></span>
          </label>
          <span className="dark-mode-text">{darkMode ? '🌙' : '☀️'}</span>
        </div>
      </nav>
      <div className="content-wrapper">
        <Chessboard />
      </div>
    </div>
  );
}

export default App;