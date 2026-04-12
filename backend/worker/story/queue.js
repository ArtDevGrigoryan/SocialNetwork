const { Queue } = require("bullmq");
const redis = require("@db/redis");

const storyQueue = new Queue("story", {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: { age: 7 * 24 * 60 * 60 },
    removeOnFail: { age: 30 * 24 * 60 * 60 },
  },
});

async function initStoryScheduler() {
  try {
    await storyQueue.upsertJobScheduler(
      "archive-expired-stories",
      {
        cron: "5 * * * *",
      },
      {
        name: "archiveExpired",
        data: {},
        opts: {
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
          priority: 5,
        },
      },
    );

    console.log(
      "✅ Story expired archive scheduler registered (every hour at :05)",
    );
  } catch (err) {
    console.error("❌ Failed to register story scheduler:", err);
  }
}

module.exports = { storyQueue, initStoryScheduler };
