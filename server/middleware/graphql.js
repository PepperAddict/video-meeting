const express = require("express");
const app = express();

//graphql portion
const { graphqlHTTP } = require("express-graphql");
const { execute, subscribe } = require("graphql");
const { makeExecutableSchema } = require("graphql-tools");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { redis, pubsub } = require("../helpers/redis");

//for subscription to work
const subscribers = [];
const onMessagesUpdates = (sub) => subscribers.push(sub);

const roots = {
  Query: {
    get: (parent, { key }, { redis }) => {
      try {
        return redis.get(key);
      } catch (error) {
        return null;
      }
    },

    messages: async (parent, { room }) => {
      let newData = [];
      await redis
        .zrange(room, 0, -1)
        .then((res) => {
          for (let eachData of res) {
            newData.push(JSON.parse(eachData));
          }
        })
        .catch((err) => console.log(err));

      return newData;
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
    rooms: async (parent, { id }) => {
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
    postMessage: async (parent, { room, name, content }) => {
      let items = JSON.stringify({
        id: name,
        name,
        content,
      });

      return await redis.zadd(room, 1, items).then((res) => {
        console.log(res)
        subscribers.forEach((fn) => fn());
        return content;
      }).catch((err) => console.log(err));
      
      
    },
    setRoom: async (parent, { id, name }) => {
      //keep track of name
      return await redis.set(id, name).then((res) => {
        console.log(res);
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
      subscribe: (parent, { id }) => {
        const SOMETHING_CHANGED_TOPIC = Math.random().toString(36).slice(2, 15);
        onMessagesUpdates(async () =>
          pubsub.publish(SOMETHING_CHANGED_TOPIC, {
            message: await redis
              .zrange(id, 0, -1)
              .then((res) => {
                let newData = [];
                for (let eachData of res) {
                  newData.push(JSON.parse(eachData));
                }
                return newData;
              })
              .catch((err) => console.log("no work 1")),
          })
        );
        setTimeout(
          async () =>
            pubsub.publish(SOMETHING_CHANGED_TOPIC, {
              message: await redis
                .zrange(id, 0, -1)
                .then((res) => {
                  console.log(res);
                  let newData = [];
                  for (let eachData of res) {
                    newData.push(JSON.parse(eachData));
                  }
                  return newData;
                })
                .catch((err) => console.log("no work")),
            }),
          0
        );

        try {
          return pubsub.asyncIterator(SOMETHING_CHANGED_TOPIC);
        } catch (err) {
          return err;
        }
      },
    },
  },
};
const types = `
  type Message {
    id: String!
    name: String!
    content: String!
  }
  type Room {
      id: String!
      name: String!
  }
  type Result {
    id: ID!
    content: String!
  }
  type Query {
    get(key: String!): String
    messages(room: String!): [Message!]
    getRoom (id: String!): Room!
    rooms: [Room]
  }

  type Mutation {
    postMessage(room: String!, name: String!, content: String!): String!
    set(key: String!, value: String!): Boolean!
    setRoom(id: String!, name: String!): Boolean! 
  }

  type Subscription {
    message(room: String!): [Message!]
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
