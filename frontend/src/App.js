import React, { useState, useEffect } from 'react';
import './App.css';
import Chessboard from './components/chessboard/Chessboard';
import Header from './components/header/header';
import Login from './components/login/login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const handleLoginOrRegister = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
  };

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  }

  return (
    <div className="App">
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      {isLoggedIn ? (
        <div className='content-wrapper'>
          <Chessboard />
        </div>
      ) : (
        <Login onLogin={handleLoginOrRegister} darkMode={darkMode} />
      )}
    </div>
  );
}

export default App;