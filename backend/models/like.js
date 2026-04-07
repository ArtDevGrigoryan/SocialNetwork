const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema({
  post: { type: mongoose.Types.ObjectId, ref: "Post" },
  user: { type: mongoose.Types.ObjectId, ref: "User" },
});

likeSchema.index({ user: 1, post: 1 }, { unique: true });

module.exports = mongoose.model("Like", likeSchema);
