require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");

app.use(express.urlencoded({ extended: true }));

const index = (res) => {
  res.sendFile(path.resolve(__dirname, "../dist/index.html"));
}

//graphql
const graphQL = require('./middleware/graphql')
app.use(graphQL)

//socketio
require('./middleware/sockets')

//webpack
const webpack = require('./middleware/webpack')
app.use(webpack)

app.get("/", (req, res) => {
  index(res)
});

app.get("/room/:page?", (req, res) => {
  index(res)
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Express server listening on port ${port}`));
