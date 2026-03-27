const mongoose = require("mongoose");

const savesSchema = new mongoose.Schema({
  user: { type: mongoose.Types.ObjectId, ref: "User" },
  posts: [{ type: mongoose.Types.ObjectId, ref: "Posts" }],
});

module.exports = mongoose.model("Saves", savesSchema);