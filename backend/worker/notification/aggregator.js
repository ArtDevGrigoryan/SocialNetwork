class NotificationAggregator {
  static async consume(redis, { countKey, usersKey }) {
    const [countRaw, users] = await Promise.all([
      redis.get(countKey),
      redis.smembers(usersKey),
    ]);

    return {
      count: parseInt(countRaw) || 0,
      users: users || [],
    };
  }

  static buildMeta(count, users) {
    return {
      count,
      users: users.slice(0, 3),
    };
  }

  static async clear(redis, keys = []) {
    if (!keys.length) return;
    await Promise.all(keys.map((k) => redis.del(k)));
  }
}

module.exports = NotificationAggregator;
