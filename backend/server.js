const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const http = require('http')
const socketIO = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socketIO(server)
const port = 1337

app.use(cors())

app.use(bodyParser.json())


let games = {}
let waitingPlayers = {}


const PIECE_TYPES = {
  PAWN: 'pawn',
  ROOK: 'rook',
  KNIGHT: 'knight',
  BISHOP: 'bishop',
  QUEEN: 'queen',
  KING: 'king'
};



app.post('/game', (req, res) => {
  const gameId = Math.random().toString(36).substring(7)
  games[gameId] = {
    board: initializeBoard(),
    currentPlayer: 'white',
    moves: [],
    enPassantTarget: null,
    castlingRights: {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true}
    },
    status: "ongoing",
    kingPositions: { white: { row: 7, col: 4 }, black: { row: 0, col: 4 } },
    winner: null
  }
  res.json({gameId})
})

app.get('/game/:id', (req, res) => {
  const gameId = req.params.id
  const player = req.query.player
  if (games[gameId]) {
    const game = games[gameId]
    const board = player === 'black' ? flipBoard(game.board) : game.board
    res.json({...game, board})
  } else {
      res.status(404).json({error: 'Game not found'})
  }
})

app.post('/game/:id/move', (req, res) => {
  const gameId = req.params.id
  const { from, to, player } = req.body
  
  console.log("Received move request:", { gameId, from, to, player })
  try {
    
    if (!games[gameId]) {
      console.log("game not found:", gameId)
      return res.status(404).json({error: 'Game not found'})
    }
    
    const game = games[gameId]
    console.log("Current game state:", game)
    
    if (!game.status)
      game.status = "ongoing"
    
    if (game.status !== "ongoing") {
      console.log('Game has already ended:', game.status)
      return res.status(400).json({ error: 'Game has already ended' });
    }

    const actualFrom = player === 'black' ? { row: 7 - from.row, col: 7 - from.col } : from
    const actualTo = player === 'black' ? { row: 7- to.row, col: 7- to.col} : to

    if (!isValidMove(game, actualFrom, actualTo)) {
      console.log('invalid move:', { from, to })
      return res.status(400).json({ error: 'Invalid move' });
    }

    makeMove(game, actualFrom, actualTo)
    console.log("Move executed succesfully, game state updated:", game)

    res.json({
      board: game.board,
      currentPlayer: game.currentPlayer,
      status: game.status,
      winner: game.winner
    })
  } catch (err) {
    console.log("Error processing the move:", err)
    res.status(500).json({error: 'Internal server error', details: err.message})
  }
  }
)

function isWhitePiece(piece) {
  return '♔♕♖♗♘♙'.includes(piece);
}

function getPieceType(piece) {
  switch (piece.toLowerCase()) {
    case '♙':
    case '♟︎':
        return PIECE_TYPES.PAWN;
    case '♖':
    case '♜':
      return PIECE_TYPES.ROOK;
    case '♘':
    case '♞':
      return PIECE_TYPES.KNIGHT;
    case '♗':
    case '♝':
      return PIECE_TYPES.BISHOP;
    case '♕':
    case '♛':
      return PIECE_TYPES.QUEEN;
    case '♔':
    case '♚':
      return PIECE_TYPES.KING;
    default:
      return null;
    }
}

function isValidMove(game, from, to) {
  const { board, enPassantTarget, castlingRights } = game
  const piece = board[from.row][from.col]
  const pieceType = getPieceType(piece)

  const dx = to.col - from.col
  const dy = to.row - from.row
  const isWhite = isWhitePiece(piece)

  // Create a deep copy of the board
  const tempBoard = board.map(row => [...row]);

  tempBoard[to.row][to.col] = tempBoard[from.row][from.col];
  tempBoard[from.row][from.col] = null;

  console.log("Temp board after move:", tempBoard);
  if (isInCheck(tempBoard, isWhite)) {
    console.log("Move puts the king in check");
    return false;
  }

  switch (pieceType) {
    case PIECE_TYPES.PAWN:
      return isValidPawnMove(game, from, to);
    case PIECE_TYPES.ROOK:
      return isValidRookMove(board, from, to);
    case PIECE_TYPES.KNIGHT:
      return isValidKnightMove(dx, dy);
    case PIECE_TYPES.BISHOP:
      return isValidBishopMove(board, from, to);
    case PIECE_TYPES.QUEEN:
      return isValidQueenMove(board, from, to);
    case PIECE_TYPES.KING:
      return isValidKingMove(game, from, to);
    default:
      return false;
  }
}


function isValidPawnMove(game, from, to) {
  const { board, enPassantTarget } = game;
  const piece = board[from.row][from.col];
  const dx = to.col - from.col;
  const dy = to.row - from.row;
  const isWhite = isWhitePiece(piece);
  const direction = isWhite ? -1 : 1;
  
  // Normal move
  if (dx === 0 && dy === direction && board[to.row][to.col] === null)
    return true;
  
  // Double move on first move
  if (dx === 0 && dy === 2 * direction && board[to.row][to.col] === null && 
    board[from.row + direction][from.col] === null &&
    ((isWhite && from.row === 6) || (!isWhite && from.row === 1)))
    return true;
  
  // Capture
  if (Math.abs(dx) === 1 && dy === direction &&
    (board[to.row][to.col] !== null || 
      (to.row === enPassantTarget.row && to.col === enPassantTarget.col)))
    return true;

  return false;
}
  
function isValidRookMove(board, from, to) {
  const dx = to.col - from.col;
  const dy = to.row - from.row;

  if (dx !== 0 && dy !== 0) return false;

  const step = { row: Math.sign(dy), col: Math.sign(dx) };
  let current = { row: from.row + step.row, col: from.col + step.col };

  while (current.row !== to.row || current.col !== to.col) {
    if (board[current.row][current.col] !== null) return false;
    current.row += step.row;
    current.col += step.col;
  }

  return true;
}

function isValidKnightMove(dx, dy) {
  return (Math.abs(dx) === 2 && Math.abs(dy) === 1) || (Math.abs(dx) === 1 && Math.abs(dy) === 2);
}

function isValidBishopMove(board, from, to) {
  const dx = to.col - from.col;
  const dy = to.row - from.row;

  if (Math.abs(dx) !== Math.abs(dy)) return false;    
  const step = { row: Math.sign(dy), col: Math.sign(dx) };
  let current = { row: from.row + step.row, col: from.col + step.col };   
  while (current.row !== to.row || current.col !== to.col) {
    if (board[current.row][current.col] !== null) return false;
    current.row += step.row;
    current.col += step.col;
  }   
  return true;
}

function isValidQueenMove(board, from, to) {
  return isValidRookMove(board, from, to) || isValidBishopMove(board, from, to);
}

function isValidKingMove(game, from, to) {
  const { board, castlingRights } = game;
  const dx = to.col - from.col;
  const dy = to.row - from.row;

  // Normal move
  if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
    return true;
  }

  // Castling
  if (dy === 0 && Math.abs(dx) === 2) {
    const isWhite = from.row === 7;
    const kingSide = dx > 0;
    if ((isWhite && !castlingRights.white[kingSide ? 'kingSide' : 'queenSide']) ||
      (!isWhite && !castlingRights.black[kingSide ? 'kingSide' : 'queenSide']))
      return false;

    const rookCol = kingSide ? 7 : 0;
    if (board[from.row][rookCol] === null) return false;
    const direction = kingSide ? 1 : -1;
    for (let col = from.col + direction; col !== rookCol; col += direction)
      if (board[from.row][col] !== null) return false;

    // Check if the king passes through check
    for (let col = from.col; col !== to.col; col += direction) {
      const tempBoard = board.map(row => [...row]);
      tempBoard[from.row][col] = tempBoard[from.row][from.col];
      tempBoard[from.row][from.col] = null;
      if (isInCheck(tempBoard, isWhite)) return false;
    }
    return true;
  }
  return false;
}

function findKing(board, isWhite) {
  const kingSymbol = isWhite ? '♔' : '♚';
  console.log(`Looking for the king: ${kingSymbol}`);

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row][col] === kingSymbol) {
        console.log(`Found king at position: row ${row}, col ${col}`);
        return { row, col };
      }
    }
  }

  console.log("King not found!");
  return null;  // Return null if king is not found
}



function isInCheck(board, isWhite) {
  const kingPosition = findKing(board, isWhite);
  console.log("king position:", kingPosition)
  if (!kingPosition) {
    throw new Error(`King not found for ${isWhite ? 'white' : 'black'} pieces`);
  }

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && isWhitePiece(piece) !== isWhite) {
        // Use the temporary board state to check if the move is valid
        const tempGame = { board, enPassantTarget: null, castlingRights: { white: { kingSide: false, queenSide: false }, black: { kingSide: false, queenSide: false } } };
        if (isValidMove(tempGame, { row, col }, kingPosition)) {
          return true;
        }
      }
    }
  }
  return false;
}


function updateBoardAfterMove(board, from, to, piece) {
  board[to.row][to.col] = piece;
  board[from.row][from.col] = null;
  return board;
}
  
// Update the makeMove function
function makeMove(game, from, to) {
  const { board, currentPlayer } = game;
  const piece = board[from.row][from.col];
  const pieceType = getPieceType(piece);
  const isWhite = isWhitePiece(piece);

  // Update the board
  board[to.row][to.col] = board[from.row][from.col];
  board[from.row][from.col] = null;

  // Handle pawn promotion
  if (pieceType === PIECE_TYPES.PAWN && (to.row === 0 || to.row === 7)) {
    board[to.row][to.col] = isWhite ? '♕' : '♛';  // Promote to queen by default
  }

  // Handle en passant capture
  if (pieceType === PIECE_TYPES.PAWN && to.col !== from.col && board[to.row][to.col] === null) {
    board[from.row][to.col] = null;  // Remove the captured pawn
  }

  // Set en passant target
  game.enPassantTarget = null;
  if (pieceType === PIECE_TYPES.PAWN && Math.abs(to.row - from.row) === 2) {
    game.enPassantTarget = { row: (from.row + to.row) / 2, col: from.col };
  }

  // Handle castling
  if (pieceType === PIECE_TYPES.KING && Math.abs(to.col - from.col) === 2) {
    const rookFromCol = to.col > from.col ? 7 : 0;
    const rookToCol = to.col > from.col ? 5 : 3;
    board[to.row][rookToCol] = board[to.row][rookFromCol];
    board[to.row][rookFromCol] = null;
  }

  // Update castling rights
  if (pieceType === PIECE_TYPES.KING) {
    game.castlingRights[currentPlayer].kingSide = false;
    game.castlingRights[currentPlayer].queenSide = false;
  } else if (pieceType === PIECE_TYPES.ROOK) {
    if (from.col === 0) game.castlingRights[currentPlayer].queenSide = false;
    if (from.col === 7) game.castlingRights[currentPlayer].kingSide = false;
  }

  // Update king position
  if (pieceType === PIECE_TYPES.KING) {
    console.log("game.kingPositions:", game.kingPositions)
    game.kingPositions[currentPlayer] = { row: to.row, col: to.col };
  }

  // Switch turns
  game.currentPlayer = currentPlayer === 'white' ? 'black' : 'white';

  // Add move to history
  game.moves.push({ from, to });
}

function initializeBoard() {
  const newBoard = Array(8).fill(null).map(() => Array(8).fill(null));
  for (let i = 0; i < 8; i++) {
    newBoard[1][i] = '♙'
    newBoard[6][i] = '♟︎'
  }
  newBoard[0] = ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'];
  newBoard[7] = ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'];
  return newBoard
}

function flipBoard() {
  return board.map(row => [...row].reverse()).reverse()
}

// sockets

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinGame', () => {
    if (waitingPlayers.length > 0) {
      const opponent = waitingPlayers.pop();
      const gameId = Math.random().toString(36).substring(7);
      games[gameId] = {
        board: initializeBoard(),
        currentPlayer: 'white',
        moves: [],
        enPassantTarget: null,
        castlingRights: {
          white: { kingSide: true, queenSide: true },
          black: { kingSide: true, queenSide: true }
        },
        status: "ongoing",
        kingPositions: { white: { row: 7, col: 4 }, black: { row: 0, col: 4 } },
        winner: null,
        players: {
          white: opponent,
          black: socket.id
        }
      };
      console.log(`Game started! Game ID: ${gameId}, White: ${opponent}, Black: ${socket.id}`);
      io.to(opponent).emit('gameStarted', { gameId, color: 'white' });
      socket.emit('gameStarted', { gameId, color: 'black' });
    } else {
      waitingPlayers.push(socket.id);
      socket.emit('waitingForOpponent');
    }
  });

  socket.on('makeMove', ({ gameId, from, to }) => {
    const game = games[gameId];
    if (game && isValidMove(game, from, to)) {
      makeMove(game, from, to);
      io.to(game.players.white).emit('moveMade', { from, to, board: game.board });
      io.to(game.players.black).emit('moveMade', { from, to, board: game.board });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    waitingPlayers = waitingPlayers.filter(player => player !== socket.id);
    // Handle game disconnection logic if needed
  });
});

server.listen(port, () => {
  console.log(`Server up and running on port: ${port}`);
});

app.listen(port, () => {
  console.log(`Server up and running on port: ${port}`)
})