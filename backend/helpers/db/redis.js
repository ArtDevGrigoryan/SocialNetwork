const { createClient } = require("redis");
const env = require("../env");

const cache = createClient({
  url: env.REDIS_URI,
});

module.exports = cache;
