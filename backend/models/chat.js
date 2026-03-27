const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    isGroup: { type: Boolean, default: false },
    groupName: String,

    admins: [{ type: mongoose.Types.ObjectId, ref: "User" }],

    lastMessage: { type: mongoose.Types.ObjectId, ref: "Message" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Chat", chatSchema);
