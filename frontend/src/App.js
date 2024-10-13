import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/header/header';
import Login from './components/login/login';
import Profile from './components/profile/profile';
import Learn from './components/learn/Learn';
import Play from './components/play/Play';
import Puzzles from './components/puzzles/Puzzles';
import Settings from './components/settings/Settings';
import Home from './components/home/home';


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
    <Router>
    <div className="App">
        <Header
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          isLoggedIn={isLoggedIn}
        />
        <Routes>
          <Route path="/login"
            element={isLoggedIn ? <Navigate to="/" />
              : <Login onLogin={handleLoginOrRegister} darkMode={darkMode} />}
          />
          <Route path="/"
            element={isLoggedIn ? <Home user={user} />
              : <Navigate to="/login" />}
          />
          <Route path="/profile"
            element={isLoggedIn ? <Profile user={user} />
              : <Navigate to="/login" />}
          />
          <Route path="/learn"
            element={isLoggedIn ? <Learn />
              : <Navigate to="/login" />}
          />
          <Route path="/play"
            element={isLoggedIn ? <Play />
              : <Navigate to="/login" />}
          />
          <Route path="/puzzles"
            element={isLoggedIn ? <Puzzles />
              : <Navigate to="/login" />}
          />
          <Route path="/settings"
            element={isLoggedIn ? <Settings />
              : <Navigate to="/login" />}
          />
      </Routes>
      </div>
      </Router>
  );
}

export default App;