const stockfish = require('stockfish');

const engine = stockfish();

engine.onmessage = (event) => {
  console.log(event);
};

const sendCommand = (command) => {
  engine.postMessage(command);
};

const getBestMove = (position) => {
  return new Promise((resolve) => {
    engine.onmessage = (event) => {
      if (event.includes('bestmove')) {
        const bestMove = event.split('bestmove ')[1].split(' ')[0];
        resolve(bestMove);
      }
    };
    sendCommand(`position fen ${position}`);
    sendCommand('go depth 15');
  });
};

module.exports = { getBestMove };
