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

const getArrayMSG = async (redis, limit = 0) => {
  let newData = [];
  await redis
    .lrange(room, 0, -1)
    .then((res) => {
      for (let eachData of res) {
        newData.push(JSON.parse(eachData));
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
  }
  type Mutation {
    postMessage(user: String!, content: String!): String!
    set(key: String!, value: String!): Boolean!
    setRoom(id: String!, name: String): Boolean!
  }
  type Subscription {
    message: [Message!]
    somethingchanged: Result
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
    getRoom: async (parent, { id }) => {
      //if this room id exists then return true otherwise false
      //since we also stored a hash, lets get the name
        let result = {}
        await redis.get(id)
          .then((res) => {
            console.log(res);
            if (res) {
              result = {
                id,
                name: res,
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
    postMessage: async (parent, { user, content }) => {
      const id = (await redis.llen(room)) + 1;
      const newdata = {
        id,
        user,
        content,
      };
      await redis
        .rpush(room, JSON.stringify(newdata))
        .catch((err) => console.log("no worky"));
      subscribers.forEach((fn) => fn());
      return id;
    },
    setRoom: async (parent, { id, name }) => {


      //keep track of name
      return await redis.set(id, name).then((res) => {

        if (res === "OK") {
          return true;
        } else {
          return false;
        }
      });
    },
  },
  Subscription: {
    message: {
      subscribe: () => {
        const SOMETHING_CHANGED_TOPIC = Math.random().toString(36).slice(2, 15);

        // let messages = await getallmsg(redis)

        onMessagesUpdates(async () =>
          pubsub.publish(SOMETHING_CHANGED_TOPIC, {
            message: await redis.lrange(room, 0, -1).then((res) => {
              let newData = [];
              for (let eachData of res) {
                newData.push(JSON.parse(eachData));
              }
              return newData;
            }),
          })
        );
        setTimeout(
          async () =>
            pubsub.publish(SOMETHING_CHANGED_TOPIC, {
              message: await redis.lrange(room, 0, -1).then((res) => {
                let newData = [];
                for (let eachData of res) {
                  newData.push(JSON.parse(eachData));
                }
                return newData;
              }),
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

  socket.on("join-room", (room, userID) => {
    user = userID;
    room = room;
    if (rooms[room]) {
      rooms[room].add(user);
    } else {
      rooms[room] = new Set();
    }
    console.log(rooms);
    socket.join(room);
    socket.to(room).broadcast.emit("user-connected", user);
    socket.emit("users", rooms);

    let discData = {
      id: Math.floor((Math.random() * 10), + 1),
      user: "System",
      content: `${user} has connected`
    }

    redis.rpush(room, JSON.stringify(discData))
    subscribers.forEach((fn) => fn());

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