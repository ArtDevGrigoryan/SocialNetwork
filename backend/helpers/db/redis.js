const Redis = require("ioredis");
const env = require("../env");

const redis = new Redis(env.REDIS_URI, { maxRetriesPerRequest: null });

module.exports = redis;
