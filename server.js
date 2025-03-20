const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');  


const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

const io = new Server(server, {
  cors: {
    origin: "*",  
    methods: ["GET", "POST"]
  }
});

app.use(cors()); 
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Handle signaling data
  socket.on('signal', (data) => {
    const { peerId, signalData } = data;
    io.to(peerId).emit('signal', { peerId: socket.id, signalData });
  });
  
  // Handle player movement
  socket.on('playerMove', (data) => {
    socket.broadcast.emit('playerMove', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    socket.broadcast.emit('playerDisconnected', socket.id);
  });
});

let players = {};


io.on('connection', (socket) => {
  socket.emit('yourID', socket.id);  
});

io.on('connection', (socket) => {
  console.log('A player connected:', socket.id);

  // Add new player
  players[socket.id] = { id: socket.id, position: [0, 1, Object.keys(players).length], rotation: [0, 0, 0] };

  // Broadcast updated player list
  io.emit('updatePlayers', players);

  // Handle player movement
  socket.on('playerMoved', (data) => {
    if (players[data.id]) {
      players[socket.id].id = data.id;
      players[socket.id].position = data.position;
      players[socket.id].rotation = data.rotation;
      console.log("player moved", socket.id);
      console.log("New position: ", data.position);
      io.emit('updatePlayers', players);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A player disconnected:', socket.id);
    delete players[socket.id];
    io.emit('updatePlayers', players);
  });
});


server.listen(PORT, () => {
  console.log('Server listening on port 3001');
});

