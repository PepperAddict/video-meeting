"use strict";

const express = require("express");
const app = express();
const router = express.Router();
const path = require("path");
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//manage socket io
const server = require("http").createServer(app)
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"],
        credentials: true
    }
})
server.listen(3000, '127.0.0.1')


//middlewware
const isDev = (process.env.NODE_ENV == "development") ? true : false;

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
    res.sendFile(path.resolve(__dirname, "../dist/index.html"))
});

let interval;
let rooms = {}

io.on("connection", (socket) => {
    const id = socket.id

    if (interval) {
        clearInterval(interval);
    }
    interval = setInterval(() => getApiAndEmit(socket), 1000);

    socket.on("disconnect", () => {
        socket.emit('user-dc', socket.id)
        clearInterval(interval);
    });

    socket.on('join room', roomID => {
        console.log(roomID)
        if (rooms[roomID]) {
            rooms[roomID].push(socket.id)
        } else {
            rooms[roomID] = [socket.id]
        }

        const otherUser = rooms[roomID].find(id => id !== socket.id);

        if (otherUser) {
            socket.emit('other user', otherUser);
            socket.to(otherUser).emit('user joined', socket.id)
        }

    })

    socket.emit('user-connected', socket.id)
});

const getApiAndEmit = socket => {
    const response = new Date();
    // Emitting a new message. Will be consumed by the client
    socket.emit("FromAPI", response);

};
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Express server listening on port ${port}`));