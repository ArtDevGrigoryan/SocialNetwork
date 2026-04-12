const StoryJobService = require("./service");

module.exports = async (job) => {
  const handler = StoryJobService[job.name];

  if (typeof handler !== "function") {
    console.warn(`⚠️ No handler found for job: ${job.name}`);
    return;
  }

  return handler(job.data);
};
