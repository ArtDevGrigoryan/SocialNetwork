const Redis = require("ioredis");
const env = require("../env");

const client = new Redis(env.REDIS_URI);

class Cache {
  del(cacheKey) {
    return client.del(cacheKey);
  }

  async get(cacheKey) {
    const cachedData = await client.get(cacheKey);
    if (!cachedData) return null;
    try {
      return JSON.parse(cachedData);
    } catch (err) {
      return cachedData;
    }
  }

  async set(cacheKey, data, options = {}) {
    const value = JSON.stringify(data);
    if (options.EX) {
      await client.set(cacheKey, value, "EX", options.EX);
    } else if (options.PX) {
      await client.set(cacheKey, value, "PX", options.PX);
    } else {
      await client.set(cacheKey, value);
    }
  }

  async removeRoom(cacheKey, userId) {
    return client.sRem(cacheKey, userId.toString());
  }

  async joinRoom(cacheKey, userId) {
    return client.sAdd(cacheKey, userId.toString());
  }

  async checkInRoom(cacheKey, userId) {
    return client.sIsMember(cacheKey, userId.toString());
  }

  async getAllMembers(cacheKey) {
    return client.sMembers(cacheKey);
  }
}

module.exports = { cache: new Cache(), client };
