const mongoose = require("mongoose");
const env = require("../env");
const { client } = require("./redis");

module.exports.connect = async function connect() {
  try {
    await mongoose.connect(`${env.MONGO_URI}/${env.APP_NAME}`);
    console.dir("Connected to MongoDB", { colors: true });

    client.on("error", (err) => {
      console.error("Redis Client Error", err);
    });

    console.dir("Redis client ready (auto-connected)", { colors: true });
  } catch (error) {
    console.error("Failed to connect:", error);
    process.exit(1);
  }
};

module.exports.disconnect = async function disconnect() {
  try {
    await mongoose.disconnect();
    console.dir("Disconnected from MongoDB", { colors: true });

    if (client.status === "ready" || client.status === "connect") {
      await client.quit();
      console.dir("Disconnected from Redis", { colors: true });
    } else {
      console.dir("Redis client already disconnected", { colors: true });
    }
  } catch (error) {
    console.error("Failed to disconnect:", error);
  }
};
