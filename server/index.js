require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");

//graphql
const graphql = require('./middleware/graphql')
app.use(graphql)


app.use(express.urlencoded({ extended: true }));

//manage socket io

const server = require("http").createServer();
const io = require("socket.io")(server, {
  cors: {
    origin: ["http://localhost:8080"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

require('./middleware/sockets')(io)
server.listen(3001);

//webpack server and hot reload stuff
const webpack = require('./middleware/webpack')
app.use(webpack)


//manage our routes
const index = (res) => {
  res.sendFile(path.resolve(__dirname, "../dist/index.html"));
}
app.get("/", (req, res) => {
  index(res)
});

app.get("/room/:page?", (req, res) => {
  index(res)
});

//now for the listening part

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Express server listening on port ${port}`));


