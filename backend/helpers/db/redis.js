const { createClient } = require("redis");
const env = require("../env");

const client = createClient({
  url: env.REDIS_URI,
});

class Cache {
  del(cacheKey) {
    return client.del(cacheKey);
  }
  async get(cacheKey) {
    const cachedData = await client.get(cacheKey);
    return JSON.parse(cachedData);
  }
  async set(cacheKey, data, options = undefined) {
    await client.set(cacheKey, JSON.stringify(data), options);
  }
  removeRoom(cachekey, userId) {
    return client.sRem(cachekey, userId.toString());
  }
  joinRoom(cacheKey, userId) {
    return client.sAdd(cacheKey, userId.toString());
  }
  checkInRoom(cacheKey, userId) {
    return client.sIsMember(cacheKey, userId);
  }
  getAllMembers(cacheKey) {
    return client.sMembers(cacheKey);
  }
}

module.exports = { cache: new Cache(), client };
