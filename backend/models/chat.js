const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
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

    unreadCount: {
      type: Number,
      default: 0,
    },

    isMuted: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
  },
  { _id: false },
);

const chatSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["dm", "group"],
      default: "dm",
    },

    participants: {
      type: [participantSchema],
      validate: [(v) => v.length >= 2, "Chat must have at least 2 users"],
    },

    groupName: String,
    groupAvatar: String,

    admins: [{ type: mongoose.Types.ObjectId, ref: "User" }],

    lastMessage: {
      type: mongoose.Types.ObjectId,
      ref: "Message",
    },

    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    dmKey: String,
    messagePermission: {
      type: String,
      enum: ["everyone", "followers", "nobody"],
      default: "everyone",
    },
  },
  { timestamps: true },
);

chatSchema.index({ lastActivityAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);
