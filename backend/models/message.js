const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Types.ObjectId,
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

    edited: { type: Boolean, default: false },

    deletedFor: [{ type: mongoose.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

messageSchema.index({ chat: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
