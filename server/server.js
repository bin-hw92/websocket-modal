const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors'); // CORS 미들웨어 추가

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: "*"
  }
});

// CORS 미들웨어를 사용하여 모든 도메인에서의 요청 허용
app.use(cors());

const connectedClients = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id, '@@@@@@@@@@@@@@');

  // 새로운 연결이 설정될 때 Offerer와 Answerer를 구분합니다.
  socket.on('createOffer', (room, userId) => {
    connectedClients[userId] = socket.id;
    socket.join(room);
    console.log(connectedClients, 'createOffer');
  });

  // Offer 메시지를 받아서 Answerer에게 전송합니다. userId 값은 answer의 값으로 적용.
  socket.on('sendOffer', (room, userId, offer) => {
    const targetSocketId = connectedClients[userId];

    if (targetSocketId !== undefined) {
      console.log('sendOffer', userId, '해당 유저에게 offer 발송', targetSocketId);
      io.to(targetSocketId).emit('receiveOffer', room, offer);
    }
  });

  // Answer 메시지를 받아서 Offerer에게 전송합니다.
  socket.on('sendAnswer', (room, roomUserId, userId, answer) => {
    const targetSocketId = connectedClients[roomUserId];

    if(targetSocketId === undefined){
      io.to(socket.id).emit('none');
      return;
    }

    connectedClients[userId] = socket.id; //내 정보도 저장해 둠.
    console.log('receiveAnswer', roomUserId, '해당 유저에게 answer 발송', targetSocketId);
    io.to(targetSocketId).emit('receiveAnswer', room, answer);
  });

  // 연결이 끊겼을 때 클라이언트 목록에서 제거합니다.
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    for (const [userId, socketId] of Object.entries(connectedClients)) {
      if (socketId === socket.id) {
        delete connectedClients[userId];
        break;
      }
    }
  });
});

const PORT =  9000;

server.listen(PORT, () => {
  console.log(`Signal server is running on port ${PORT}`);
});