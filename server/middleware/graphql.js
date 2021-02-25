const express = require("express");
const app = express();
let room = "test";
//graphql portion
const { graphqlHTTP } = require("express-graphql");
const { execute, subscribe } = require("graphql");
const { makeExecutableSchema } = require("graphql-tools");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { RedisPubSub } = require("graphql-redis-subscriptions");

//for subscription to work
const subscribers = [];
const onMessagesUpdates = (sub) => subscribers.push(sub);

const Redis = require("ioredis");
const options = {
  host: process.env.REDIS_HOST,
  port: 6379,
  password: process.env.REDIS_PASS,
};
const redis = new Redis(options);
const pubsub = new RedisPubSub({
  publisher: new Redis(options),
  subscriber: new Redis(options),
});

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
      let newData = [];
      await lrange(room, 0, -1).then((res) => {
        for (let eachData of res) {
          newData.push(JSON.parse(eachData));
        }
      });
      return newData;
    },
    getRoom: async (parent, { id }) => {
      return await sismember("room", id).then((res) => {
        console.log(res);
        if (res === 1) {
          return true;
        } else {
          return true;
        }
      });
    },
    rooms: async (parent, { id }) => {
      return await redis.smembers("room").then((res) => {
        return res;
      });
    },
  },

  Mutation: {
    postMessage: async (parent, { user, content }, { redis }) => {
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
    setRoom: async (parent, { id }) => {
      return await redis.sadd("room", id).then((res) => {
        console.log(res);
        if (res === 1) {
          return true;
        } else {
          return true;
        }
      });
    },
  },
  Subscription: {
    message: {
      subscribe: () => {
        const SOMETHING_CHANGED_TOPIC = Math.random().toString(36).slice(2, 15);


        onMessagesUpdates(async () =>
          pubsub.publish(SOMETHING_CHANGED_TOPIC, {
            message: await redis
              .lrange(room, 0, -1)
              .then((res) => {
                let newData = [];
                for (let eachData of res) {
                  newData.push(JSON.parse(eachData));
                }
                return newData;
              })
              .catch((err) => console.log(err)),
          })
        );
        setTimeout(
          async () =>
            pubsub.publish(SOMETHING_CHANGED_TOPIC, {
              message: await redis
                .lrange(room, 0, -1)
                .then((res) => {
                  let newData = [];
                  for (let eachData of res) {
                    newData.push(JSON.parse(eachData));
                  }
                  return newData;
                })
                .catch((err) => console.log("this broken")),
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
const types = `
  type Message {
    id: ID!
    user: String!
    content: String!
  }
  type Room {
      id: String!
  }
  type Result {
    id: ID!
    content: String!
  }
  type Query {
    get(key: String!): String
    messages: [Message!]
    getRoom (id: String!): Boolean!
    rooms: [Room]
  }

  type Mutation {
    postMessage(user: String!, content: String!): String!
    set(key: String!, value: String!): Boolean!
    setRoom(id: String!): Boolean! 
  }

  type Subscription {
    message: [Message!]
    somethingchanged: Result
  }`;

const schema = makeExecutableSchema({
  typeDefs: types,
  resolvers: roots,
});

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
app.all(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true,
    subscriptionsEndpoint: `ws://localhost:3000/subscriptions`,
    context: { redis, pubsub },
  })
);


module.exports = app;
