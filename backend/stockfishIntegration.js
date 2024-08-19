const stockfish = require('stockfish');

const engine = stockfish();

engine.onmessage = (event) => {
  console.log(event.data);
};

const sendCommand = (command) => {
  engine.postMessage(command);
};

const getBestMove = (position) => {
  return new Promise((resolve) => {
    engine.onmessage = (event) => {
      if (event.data.includes('bestmove')) {
        const bestMove = event.data.split('bestmove ')[1].split(' ')[0];
        resolve(bestMove);
      }
    };
    sendCommand(`position fen ${position}`);
    sendCommand('go depth 15');
  });
};

module.exports = { getBestMove };
