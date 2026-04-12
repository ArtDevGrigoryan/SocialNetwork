require("module-alias/register");
const { Worker } = require("bullmq");
const redis = require("@db/redis");
const { connect } = require("@db/connect");

const notificationProcessor = require("./processor");

(async () => {
  await connect();

  const worker = new Worker(
    "notifications",
    async (job) => {
      return notificationProcessor(job);
    },
    { connection: redis },
  );

  console.log("Notification worker started");
})();
