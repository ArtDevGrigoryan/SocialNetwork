const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["TEXT", "VOICE"],
      required: true,
    },
    text: {
      type: String,
      required: function () {
        return this.type === "TEXT";
      },
    },
    voiceUrl: {
      type: String,
      required: function () {
        return this.type === "VOICE";
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Message", messageSchema);
