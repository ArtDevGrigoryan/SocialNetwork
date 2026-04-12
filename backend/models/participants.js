const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    chatId: { type: mongoose.Types.ObjectId, ref: "Chat", required: true },
    participantName: { type: String },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastReadMessage: {
      type: mongoose.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member",
    },
    unreadCount: {
      type: Number,
      default: 0,
    },

    deletedAt: { type: Date, default: null },
    isMuted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Participant", participantSchema);
