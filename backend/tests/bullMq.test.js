require("module-alias/register");

const queue = require("@worker/notification/queue");

(async () => {
  console.log("test-started");
  await queue.add("like-batch", {
    postId: 1,
    toUser: 123,
  });
  console.log("job sent");
  process.exit(0)
})();
