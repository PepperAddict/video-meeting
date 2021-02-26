module.exports = function(io) {
  const {redis} = require('../helpers/redis')
  //manage socket io
  
  let interval;
  let rooms = {};

  io.on("connection", (socket) => {
    let user;
    let room = 'kitty';
    if (interval) {
      clearInterval(interval);
    }
    interval = setInterval(() => getApiAndEmit(socket), 1000);

    socket.on("disconnect", () => {
      socket.to(room).broadcast.emit("user-disconnected", user);

      let discData = {
        id: Math.floor(Math.random() * 10, +1),
        user: "System",
        content: `${user} has disconnected`,
      };

      // redis.rpush(room, JSON.stringify(discData));
      // subscribers.forEach((fn) => fn());
      if (rooms.hasOwnProperty(room)) {
        rooms[room].has(user) && rooms[room].delete(user);
      }

      clearInterval(interval);
    });

    socket.on("join-room", (roomID, userID) => {
      console.log('ive joined ', roomID, userID)
      room = roomID;
      user = userID;
      if (rooms[roomID]) {
        rooms[roomID].add(user);
      } else {
        rooms[roomID] = new Set();
      }
      console.log(rooms)
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

    socket.on("send-chat-message", (message) => {
      const response = new Date();
      socket.emit("chat-message", {
        message: { message: message, user: user, timestamp: response },
      });
    });
  });

  const getApiAndEmit = (socket) => {
    const response = new Date();
    // Emitting a new message. Will be consumed by the client
    socket.emit("FromAPI", response);
  };


};
