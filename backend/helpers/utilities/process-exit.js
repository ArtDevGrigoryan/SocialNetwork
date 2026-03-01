const shutDown = require("./shut-down");

module.exports = function processEventHandler(server, socket) {
  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    shutDown(server, socket);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    shutDown(server, socket);
    process.exit(1);
  });

  process.on("SIGINT", () => {
    console.log("Received SIGINT. Shutting down gracefully...");
    shutDown(server, socket);
  });

  process.on("SIGTERM", () => {
    console.log("Received SIGTERM. Shutting down gracefully...");
    shutDown(server, socket);
  });

  process.on("exit", (code) => {
    console.log(`Process exiting with code: ${code}`);
    shutDown(server, socket);
  });
};
