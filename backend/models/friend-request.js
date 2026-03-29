const mongoose = require("mongoose");

const friendRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["ACCEPTED", "DECLINED", "PENDING"],
      default: "PENDING",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("FriendRequest", friendRequestSchema);
