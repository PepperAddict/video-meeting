

const express = require("express");
const app = express();
const router = express.Router();
const path = require("path");
require('dotenv').config
//graphql portion
const https = require("https");
const { graphqlHTTP } = require("express-graphql");
const ws = require("ws");
const { execute, subscribe, buildSchema } = require("graphql");
const { useServer } = require("graphql-ws/lib/use/ws");
const { makeExecutableSchema } = require('graphql-tools');
const Redis = require('ioredis')
const redis = new Redis({
  host: process.env.REDIS_HOST, 
  port: 6379,
  password: process.env.REDIS_PASS
})

const { RedisPubSub } = require('graphql-redis-subscriptions');
const pubsub = new RedisPubSub({
publisher: redis,
subscriber: redis
});
const messages = [{id: 1, user:"jake", content: "candies"}];
const subscribers = [];
const onMessagesUpdates = (fn) => subscribers.push(fn)

const types = `
  type Message {
    id: ID!
    user: String!
    content: String!
  }

  type Query {
    message: [Message!]
  }

  type Mutation {
    postMessage(user: String!, content: String!): String!
  }

  type Subscription {
    message: [Message!]
  }
`;

const roots = {
  Query: {
    message: () => messages,
  },

  Mutation: {
    postMessage: (parent, { user, content }) => {
      const id = messages.length;
      messages.push({
        id,
        user,
        content,
      });
      subscribers.forEach(fn => fn())
      return id;
    },
  },
  Subscription: {
    message: {
      subscribe: () => {
        const channel = Math.random().toString(36).slice(2, 15);
        onMessagesUpdates(() => pubsub.publish(channel, {message: messages}))
        setTimeout(() => pubsub.publish(channel, {messages}), 0)
        return pubsub.asyncIterator(channel)
      }
    }
  }
};
const subserver = https.createServer(function weServeSocketsOnly(_, res) {
  res.writeHead(404);
  res.end();
});
const schema = makeExecutableSchema({
  typeDefs: types,
  resolvers: roots,
});
app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true,
  })
);

useServer(
  {
    types, 
    roots, 
    execute, 
    subscribe,
  },
  new ws.Server({
    server: subserver, 
    path: '/graphql'
  })
)
subserver.listen(443)

//end graphql portion

app.use(express.urlencoded({ extended: true }));

//manage socket io
const server = require("http").createServer();
const io = require("socket.io")(server, {
  cors: {
    origin: ["http://localhost:8080", "https://d2e5abbd860c.ngrok.io"],
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
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Express server listening on port ${port}`));
