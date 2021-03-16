require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
let room;
//graphql portion
const { graphqlHTTP } = require("express-graphql");
const { execute, subscribe } = require("graphql");
const { makeExecutableSchema } = require("graphql-tools");
const Redis = require("ioredis");
const { altairExpress } = require("altair-express-middleware");
const { SubscriptionServer } = require("subscriptions-transport-ws");

const {PeerServer} = require('peer')
const peerServer = PeerServer({port: 9000, path: '/peerjs'})

const options = {
  host: process.env.REDIS_HOST,
  port: 6379,
  password: process.env.REDIS_PASS,
};

const { RedisPubSub } = require("graphql-redis-subscriptions");
const pubsub = new RedisPubSub({
  publisher: new Redis(options),
  subscriber: new Redis(options),
});
const redis = new Redis(options);
const subscribers = [];
const onMessagesUpdates = (sub) => subscribers.push(sub);

const parseMSG = async(res) => {

  let newData = [];
  for (let eachData of res) {
    let each = eachData.split('/')
    
    let obj = {
      id: each[0],
      user: each[1],
      content: each[2]
    }

    newData.push(obj);
  }
  return newData;
}
const postMSG = async (room, user, content) => {
  const id = (await redis.llen(room)) + 1;
  const fullMessage = `${id}/${user}/${content}`
  await redis
    .rpush(room, fullMessage)
    .catch((err) => console.log("no worky"));
  return id
}
const getArrayMSG = async (redis, limit = 0, tran = false) => {
  let newData = [];
  let theRoom = (tran) ? room + '+t' : room
  await redis
    .lrange(theRoom, 0, -1)
    .then((res) => {
      for (let eachData of res) {
        eachData.split('/')
        let obj = {
          id: eachData[0],
          user: eachData[1],
          content: eachData[2]
        }
        newData.push(obj);
      }
    })
    .catch((err) => console.log(err));

  return newData;
};

const types = `
  type Message {
    id: ID!
    user: String!
    content: String!
    room: String!
  }
  type Result {
    id: ID!
    content: String!
  }
  type Room {
    id: ID!
    name: String!
  }
  type Query {
    get(key: String!): String
    messages: [Message!]
    getRoom(id: String!): Room!
    getRooms: [Room]
    transcription: [Message!]
  }
  type Mutation {
    postMessage(user: String!, content: String!, room: String!): String!
    postTran(user: String!, content: String!, room: String!): String!
    set(key: String!, value: String!): Boolean!
    setRoom(id: String!, name: String): Boolean!
    editTran(key: Int!, user: String!, content: String!, room: String!): Boolean!
  }
  type Subscription {
    message(room: String!): [Message!]
    somethingchanged: Result
    transcription(room: String!): [Message!]
  }
`;

const roots = {
  Query: {
    get: (parent, { key }, { redis }) => {
      try {
        return redis.get(key);
      } catch (error) {
        return null;
      }
    },
    messages: async () => {
      return getArrayMSG(redis, -1);
    },
    transcription: async () => {
      return getArrayMSG(redis, -1, true)
    },
    getRoom: async (parent, { id }) => {
      //if this room id exists then return true otherwise false
      //since we also stored a hash, lets get the name
        let result = {}
        await redis.lrange('room'+id, 0, 1)
          .then((res) => {
            if (res.length > 0) {
              result = {
                id,
                name: res[0],
              };
            } else {
              result = {
                id: "error-not-found",
                name: "none",
              };
            }
          })
          .catch((err) => console.log(err));
          return result
    },
    getRooms: async (parent, { id }) => {
      //this query is for showing all of the rooms available
      let rooms = [];

      await redis.smembers("room").then(async (res) => {
        for (let room of res) {
          let name = await redis.get(room);
          rooms.push({ id: room, name });
        }
      });
      return rooms;
    },

  },

  Mutation: {
    postMessage: async (parent, { user, content, room }) => {
      let process = await postMSG(room, user, content)
      subscribers.forEach((fn) => fn());
      return process;
    },
    postTran: async (parent, { user, content, room }) => {
      let tran = room + '+t'
     let process = await postMSG(tran, user, content)
      subscribers.forEach((fn) => fn());
      return process;
    },
    editTran: async (parent, {key, user, content, room}) => {
      let tran = room + '+t'
      let theKey = parseInt(key)
      let value = `${key + 1}/${user}/${content}`
      subscribers.forEach((fn) => fn());
      return await redis.lset(tran, theKey, value).then((res) => {
        if (res === "OK") {
          return true
        } else {
          return false
        }
      })
    },
    setRoom: async (parent, { id, name }) => {

      //keep track of name
      return await redis.lpush('room'+ id, name).then((res) => {

        if (res === 1) {
          return true;
        } else {
          return false;
        }
      }).catch((err) => console.log(err));
    },
  },
  Subscription: {
    message: {
      subscribe: (payload, {room}) => {

        const SOMETHING_CHANGED_TOPIC = Math.random().toString(36).slice(2, 15);

        onMessagesUpdates(async () =>
          pubsub.publish(SOMETHING_CHANGED_TOPIC, {
            message: await redis.lrange(room, 0, -1).then( async (res) => {
              return await parseMSG(res)
            }).catch((err) => console.log('two', err)),
          })
        );
        setTimeout(
          async () =>
            pubsub.publish(SOMETHING_CHANGED_TOPIC, {
              message: await redis.lrange(room, 0, -1).then(async (res) => {
                return await parseMSG(res)
              }).catch((err) => console.log('one', err)),
            }),
          0
        );
        try {
          return pubsub.asyncIterator(SOMETHING_CHANGED_TOPIC);
        } catch (err) {
          console.log(err);
          return err;
        }
      },
    },
    transcription: {

      subscribe: (payload, {room}) => {
        const SOMETHING_CHANGED_TOPIC = Math.random().toString(36).slice(2, 15);
        let tranRoom = room + '+t';

        onMessagesUpdates(async () =>
          pubsub.publish(SOMETHING_CHANGED_TOPIC, {
            transcription: await redis.lrange(tranRoom, 0, -1).then(async (res) => {

              return await parseMSG(res)
            }).catch((err) => console.log('three', err)),
          })
        );
        setTimeout(
          async () =>
            pubsub.publish(SOMETHING_CHANGED_TOPIC, {
              transcription: await redis.lrange(tranRoom, 0, -1).then(async (res) => {
                return await parseMSG(res)
              }).catch((err) => console.log('four', err)),
            }),
          0
        );
        try {
          return pubsub.asyncIterator(SOMETHING_CHANGED_TOPIC);
        } catch (err) {
          console.log(err);
          return err;
        }
      },

    }
  },
};

const schema = makeExecutableSchema({
  typeDefs: types,
  resolvers: roots,
});
app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true,
    subscriptionsEndpoint: `ws://localhost:3000/subscriptions`,
    context: { redis, pubsub },
  })
);

app.use(
  "/altair",
  altairExpress({
    endpointURL: "/graphql",
    subscriptionsEndpoint: `ws://localhost:3000/subscriptions`,
    initialQuery: `query {message {id}}`,
    context: { redis, pubsub },
  })
);
const subscriptionServer = require("http").createServer();
subscriptionServer.listen(3000, () => {
  new SubscriptionServer(
    {
      execute,
      subscribe,
      schema,
    },
    {
      server: subscriptionServer,
      path: "/subscriptions",
      context: { redis, pubsub },
    }
  );
});

//end graphql portion

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

server.listen(3001);

//middlewware
const isDev = process.env.NODE_ENV == "development" ? true : false;

//webpack
const webpack = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");

const config = require("../config/webpack.config.js");
const { SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS } = require("constants");
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
app.get("/room/:page?", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../dist/index.html"));
});


let interval;
let rooms = {};

io.on("connection", (socket) => {
  let user;

  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => getApiAndEmit(socket), 1000);

  socket.on("disconnect", () => {
    socket.to(room).broadcast.emit("user-disconnected", user);

    subscribers.forEach((fn) => fn());
    if (rooms.hasOwnProperty(room)) {
      rooms[room].has(user) && rooms[room].delete(user);
    }

    clearInterval(interval);
  });

  socket.on("join-room", (room, user) => {
  socket.join(room);
    console.log('user joined')
    if (rooms[room]) {
      rooms[room].add(user);
    } else {
      rooms[room] = new Set();
      rooms[room].add(user)
    }
    console.log(rooms);
    
    
socket.to(room).emit("user-connected", user);

  });

  socket.on('captioned', (user, message) => {

    let newData = {
      id: Math.floor((Math.random() * 10), + 1),
      user: user,
      content: `${user}: ${message}`
    }

    redis.rpush(room, JSON.stringify(newData))
    subscribers.forEach((fn) => fn());
  })

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