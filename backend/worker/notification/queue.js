const { Queue } = require("bullmq");
const redis = require("@db/redis");

module.exports = new Queue("notifications", {
  connection: redis,
});
