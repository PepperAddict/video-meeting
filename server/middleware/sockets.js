let interval;
let rooms = {};

const server = require("http").createServer();

const io = require("socket.io")(server, {
  cors: {
    origin: ["http://localhost:8080"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

server.listen(3001);

io.on("connection", (socket) => {
  let room = "test";
  let user;
  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => getApiAndEmit(socket), 1000);

  socket.on("disconnect", () => {
    socket.to(room).broadcast.emit("user-disconnected", user);

    if (rooms.hasOwnProperty(room)) {
      rooms[room].has(user) && rooms[room].delete(user);
    }

    clearInterval(interval);
  });

  socket.on("join-room", (roomID, userID) => {
    room = roomID;
    user = userID;
    if (rooms[roomID]) {
      rooms[roomID].add(user);
    } else {
      rooms[roomID] = new Set();
    }
    console.log(rooms);
    socket.join(room);
    socket.to(room).broadcast.emit("user-connected", user);
    socket.emit("users", rooms);
  });

  socket.on("call-user", (data) => {
    socket.to(data.to).emit("call-made", {
      offer: data.offer,
      socket: socket.id,
    });
  });

  socket.on("make-answer", (data) => {
    socket.to(data.to).emit("answer-made", {
      socket: socket.id,
      answer: data.answer,
    });
  });

});

const getApiAndEmit = (socket) => {
  const response = new Date();
  socket.emit("FromAPI", response);
};

module.exports = io