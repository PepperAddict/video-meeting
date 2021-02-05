const express = require("express");
const app = express();
const spdy = require("spdy");
const path = require("path");
const fs = require("fs");
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");
const bodyParser = require("body-parser");
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


  config.entry.index.unshift("webpack-dev-server/client?http://localhost:8080")

  config.entry.index.unshift(
    "webpack-hot-middleware/client?reload=true"
  );


  config.plugins.push(new webpack.HotModuleReplacementPlugin());

  app.use(
    webpackDevMiddleware(compiler, {
      publicPath: config.output.publicPath,
      hot: true, 
      historyApiFallback: true
    })
  );
  app.use(webpackHotMiddleware(compiler));
}


app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../dist/index.html"));
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

if (module['hot']) {
  module['hot'].accept();
}
