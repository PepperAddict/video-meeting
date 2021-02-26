const { RedisPubSub } = require("graphql-redis-subscriptions");
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

module.exports = {
    redis, pubsub
}