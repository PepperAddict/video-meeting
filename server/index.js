const express = require("express");

const app = express();
const spdy = require("spdy");
const path = require("path");
const fs = require("fs");
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");
const bodyParser = require("body-parser");

//livereload
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");

// open livereload high port and start to watch public directory for changes
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, "../src"));

// ping browser on Express boot, once browser has reconnected and handshaken
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//middlewware
const devServerEnabled = true;


if (devServerEnabled) {
  const webpackDevMiddleware = require("webpack-dev-middleware");
  const webpackHotMiddleware = require("webpack-hot-middleware");
  const config = require("../config/webpack.config.js");
  const webpack = require("webpack");
  const compiler = webpack(config);


   config.entry.index.unshift("webpack-hot-middleware/client?reload=true");
   config.entry.index.unshift("webpack/hot/only-dev-server");
  config.entry.index.unshift("react-hot-loader/patch");

   config.plugins.unshift(new webpack.HotModuleReplacementPlugin())

  app.use(webpackDevMiddleware(compiler, config.devServer))
  app.use(webpackHotMiddleware(compiler));
}

app.use(connectLivereload());

app.get("/", (req, res) => {

  res.write(webpackDevMiddleware.fileSystem.readFileSync(path.join(__dirname, '/dist/', 'index.html')));
});

app.use("/room", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../dist/index.html"));
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    console.log(roomId, userId);
  });
});

app.listen("8080", () => {
  console.log("server started");
});

if (module["hot"]) {
  module["hot"].accept();
}
