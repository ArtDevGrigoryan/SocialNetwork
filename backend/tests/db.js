const env = require("./env");
const mongoose = require("mongoose");

module.exports = {
  connect: async () => {
    try {
      await mongoose.connect(`${env.MONGO_URI}/${env.APP_NAME}`);
      console.dir("Connected to MongoDB", { colors: true });
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      process.exit(1);
    }
  },
  disconnect: async () => {
    try {
      await mongoose.disconnect();
      console.dir("Disconnected from MongoDB", { colors: true });
    } catch (error) {
      console.error("Failed to disconnect from MongoDB:", error);
    }
  },
};
