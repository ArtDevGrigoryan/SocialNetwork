const mongoose = require("mongoose");

const blockedUserSchema = new mongoose.Schema(
  {
    blocker: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    blocked: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Block", blockedUserSchema);
