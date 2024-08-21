// backend/testStockfish.js
const { getBestMove } = require('./stockfishIntegration');
console.log('testStockfish.js');

const testPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // Starting position in FEN

getBestMove(testPosition).then((bestMove) => {
  console.log(`Best move: ${bestMove}`);
});
