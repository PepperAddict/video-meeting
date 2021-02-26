require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");

//webpack server and hot reload stuff
const webpack = require('./middleware/webpack')
app.use(webpack)
//manage socket io

const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: '*',
  }
});

require('./middleware/sockets')(io)

//graphql
const graphql = require('./middleware/graphql')
app.use(graphql)


app.use(express.urlencoded({ extended: true }));


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

server.listen(process.env.PORT || 8080, function() {
  var host = server.address().address
  var port = server.address().port
  console.log('App listening at http://%s:%s', host, port)
});