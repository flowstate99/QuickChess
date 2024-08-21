const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
// const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/User');
const gameRoutes = require('./routes/Game');
const aiRoutes = require('./routes/ai');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Check if MongoDB is running and accessible
// mongoose.connect('mongodb://localhost/chesscom-clone', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('Connected to MongoDB'))
// .catch(err => console.error('Could not connect to MongoDB:', err));

app.use(cors());
app.use(express.json());

// Check if route files exist and are properly exported
try {
  app.use('/api/users', userRoutes);
  app.use('/api/games', gameRoutes);
  app.use('/api/ai', aiRoutes);
} catch (error) {
  console.error('Error setting up routes:', error);
  process.exit(1);
}

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('joinGame', (gameId) => {
    socket.join(gameId);
    console.log(`Client joined game ${gameId}`);
  });

  socket.on('makeMove', (data) => {
    const { gameId, move } = data;
    io.to(gameId).emit('moveMade', move);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Wrap server.listen in a try-catch block
try {
  server.listen(1337, () => {
    console.log('Server is running on port 1337');
  });
} catch (error) {
  console.error('Failed to start server:', error);
}

// Add error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Add error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
