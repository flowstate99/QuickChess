import React from 'react'
import Chessboard from './components/chessboard';
import './App.css'

function App() {
  return (
    <div className='App'>
      <h1>ChessGOD</h1>
      <div className='Game'>
        <Chessboard />
        {/* <GameControls /> */}
      </div>
    </div>
  );
}

export default App;
