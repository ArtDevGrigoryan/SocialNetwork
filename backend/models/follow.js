const mongoose = require("mongoose");

const followSchema = new mongoose.Schema(
  {
    follower: { type: mongoose.Types.ObjectId, ref: "User" },
    following: { type: mongoose.Types.ObjectId, ref: "User" },
    notifications: {
      new_post: { type: Boolean, default: true },
      new_story: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Follow", followSchema);
