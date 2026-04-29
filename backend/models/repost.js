const mongoose = require("mongoose");

const repostsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "User" },
    post: { type: mongoose.Types.ObjectId, ref: "Posts" },
    author: { type: mongoose.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

repostsSchema.index({ post: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Reposts", repostsSchema);
