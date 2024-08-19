const Chess = require('chess.js')

const game = new Chess()

game.move('e4')
console.log(game.ascii())