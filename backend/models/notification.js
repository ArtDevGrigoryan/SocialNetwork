const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    toUser: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },

    fromUser: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },

    type: {
      type: String,
      enum: [
        "LIKE",
        "FOLLOW",
        "REQUEST",
        "DECLINED",
        "ACCEPTED",
        "COMMENT",
        "MESSAGE",
        "NEW_GROUP",
        "GROUP_REMOVED",
        "PARTICIPANT_REMOVED",
        "PARTICIPANT_REMOVED_NOTICE",
        "NEW_POST",
        "NEW_STORY",
        "SYSTEM",
      ],
      required: true,
    },

    entity: {
      type: mongoose.Types.ObjectId,
      refPath: "entityModel",
    },

    entityModel: {
      type: String,
      enum: ["User", "Post", "Comment", "Message", "Chat"],
    },

    meta: {
      count: { type: Number, default: 1 },
      users: [
        {
          type: mongoose.Types.ObjectId,
          ref: "User",
        },
      ],
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    isSended: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notifications", notificationSchema);
