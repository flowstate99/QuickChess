// backend/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/User');
const gameRoutes = require('./routes/Game'); // Ensure this line is present
const aiRoutes = require('./routes/ai');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

mongoose.connect('mongodb://localhost/chesscom-clone', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes); // Ensure this line is present
app.use('/api/ai', aiRoutes);

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

server.listen(1337, () => {
  console.log('Server is running on port 1337');
});
