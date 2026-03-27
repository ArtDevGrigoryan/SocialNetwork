const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Types.ObjectId, ref: "Posts", index: true },
    author: { type: mongoose.Types.ObjectId, ref: "User" },
    text: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comments", commentSchema);