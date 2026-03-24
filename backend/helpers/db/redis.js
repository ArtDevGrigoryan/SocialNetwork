const { createClient } = require("redis");
const env = require("../env");

const client = createClient({
  url: env.REDIS_URI,
});

class Cache {
  async del(cacheKey) {
    return await client.del(cacheKey);
  }
  async get(cacheKey) {
    const cachedData = await client.get(cacheKey);
    return JSON.parse(cachedData);
  }
  async set(cacheKey, data, options = undefined) {
    await client.set(cacheKey, JSON.stringify(data), options);
  }
  async updateRoom(cacheKey, data) {
    let cached = (await client.get(cacheKey)) ?? "{}";
    cached = JSON.parse(cached);
  }
  async joinRoom(cacheKey, data) {
    let cached = (await client.get(cacheKey)) ?? "{}";
    cached = JSON.parse(cached);
    cached.roomId = data.roomId;
    cached.users = cached.users ?? [];
    cached.users.push(...data.users);
  }
}

module.exports = { cache: new Cache(), client };
