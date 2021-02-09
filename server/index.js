"use strict";

const express = require("express");
const app = express();
const router = express.Router();
const path = require("path");
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//manage socket io
const server = require("http").createServer();
const io = require("socket.io")(server, {
  cors: {
    origin: ["http://localhost:8080", 'https://d2e5abbd860c.ngrok.io'],
    methods: ["GET", "POST"],
    credentials: true,
  },
});
server.listen(3000);

//middlewware
const isDev = process.env.NODE_ENV == "development" ? true : false;

//webpack
const webpack = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");

const config = require("../config/webpack.config.js");
const compiler = webpack(config);
app.use(webpackDevMiddleware(compiler, config.devServer));

if (isDev) {
  const webpackHotMiddleware = require("webpack-hot-middleware");
  app.use(webpackHotMiddleware(compiler));
}

app.get("/", (req, res) => {
  res.write(
    webpackDevMiddleware.fileSystem.readFileSync(
      path.join(__dirname, "/dist/", "index.html")
    )
  );
});

//creating io and stuff
app.get("/room", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../dist/index.html"));
});

let interval;
let rooms = {};


io.on("connection", (socket) => {
  let user;
  let room;
  socket.emit("room", rooms);
  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => getApiAndEmit(socket), 1000);

  socket.on("disconnect", () => {

    socket.emit("user-dc", user);

    if (rooms.hasOwnProperty(room)) {
      rooms[room].has(user) && rooms[room].delete(user)
    }

    clearInterval(interval);
  });


  socket.on("join-room", (roomID, userID) => {

    room = roomID
    user = userID
    if (rooms[roomID]) {
      rooms[roomID].add(user);
    } else {
      rooms[roomID] = new Set()
    }
    console.log(rooms)
    socket.join(room)
    socket.to(room).broadcast.emit('user-connected', user)

  });

  
});
 
const getApiAndEmit = (socket) => {
  const response = new Date();
  // Emitting a new message. Will be consumed by the client
  socket.emit("FromAPI", response);
};
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Express server listening on port ${port}`));
