require("module-alias/register");
const { Worker } = require("bullmq");
const redis = require("@db/redis");
const { connect } = require("@db/connect");
const storyProcessor = require("./processor");
const { initStoryScheduler } = require("./queue");

(async () => {
  await connect();
  await initStoryScheduler();

  const worker = new Worker(
    "story",
    async (job) => {
      return storyProcessor(job);
    },
    {
      connection: redis,
      concurrency: 10,
      limiter: {
        max: 30,
        duration: 10000,
      },
    },
  );

  worker.on("completed", (job) => {
    console.log(`Story job completed: ${job.name} (${job.id})`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Story job failed: ${job?.name} (${job?.id})`, err);
  });

  console.log("Story Worker + Scheduler started successfully");
})();
