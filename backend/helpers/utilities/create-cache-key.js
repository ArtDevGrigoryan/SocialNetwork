module.exports.createSocketCacheKey = function (id) {
  return `socket:${id}`;
};

module.exports.feedStoryKey = function (userId) {
  return `story:feed:${userId}`;
};

module.exports.keys = function ({ type, entityId, toUser }) {
  const baseKey = `notif:${type}:${entityId}:${toUser}`;

  return {
    baseKey,
    scheduledKey: `${baseKey}:scheduled`,
    usersKey: `${baseKey}:users`,
    countKey: `${baseKey}:count`,
  };
};
