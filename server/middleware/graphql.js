const express = require("express");
const app = express();


//graphql portion
const { graphqlHTTP } = require("express-graphql");
const { execute, subscribe } = require("graphql");
const { makeExecutableSchema } = require("graphql-tools");

const { altairExpress } = require("altair-express-middleware");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { RedisPubSub } = require("graphql-redis-subscriptions");

let room = 'test'
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
      let newData = []
       await lrange(room, 0, -1).then((res) => {
        for (let eachData of res) {
          newData.push(JSON.parse(eachData))
        }
      });
      return newData
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
const types  =`
type Message {
    id: ID!
    user: String!
    content: String!
  }
  type Result {
    id: ID!
    content: String!
  }


  type Query {
    get(key: String!): String
    messages: [Message!]
  }


  type Mutation {
    postMessage(user: String!, content: String!): String!
    set(key: String!, value: String!): Boolean!
  }

  type Subscription {
    message: [Message!]
    somethingchanged: Result
    
  }`
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

module.exports = app