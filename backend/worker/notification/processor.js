const JobService = require("@worker/notification/service");

module.exports = async (job) => {
  const handler = JobService[job.name];

  if (typeof handler !== "function") return;

  return handler(job.data);
};
