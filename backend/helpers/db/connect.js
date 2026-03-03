const mongoose = require("mongoose");
const env = require("../env");

module.exports.connect = async function connect() {
  try {
    await mongoose.connect(`${env.MONGO_URI}/${env.APP_NAME}`);
    console.dir("Connected to MongoDB", { colors: true });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

module.exports.disconnect = async function disconnect() {
  try {
    await mongoose.disconnect();
    console.dir("Disconnected from MongoDB", { colors: true });
  } catch (error) {
    console.error("Failed to disconnect from MongoDB:", error);
  }
};
