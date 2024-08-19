import React from 'react';
import {Route, Routes } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import HomePage from './components/HomePage';
import GamePage from './components/GamePage';
import Login from './components/Login';
import SignUp from './components/SignUp';
import './App.css';

const App = () => {
  return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
  );
};

export default App;


