const mongoose = require("mongoose");

const repostsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "User" },
    post: { type: mongoose.Types.ObjectId, ref: "Posts" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reposts", repostsSchema);