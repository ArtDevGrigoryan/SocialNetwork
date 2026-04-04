const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "User", index: true },

    type: {
      type: String,
      enum: [
        "LIKE",
        "FOLLOW",
        "UNFOLLOW",
        "FOLLOW_REQUEST",
        "FOLLOW_ACCEPTED",
        "FOLLOW_DECLINED",
        "FOLLOW_CANCELED",
        "MESSAGE",
        "COMMENT",
        "START_DM",
        "JOINED_CHAT",
        "CHAT_DELETED",
        "USER_REMOVED",
        "USER_REMOVED_NOTICE",
      ],
    },

    entity: {
      type: mongoose.Types.ObjectId,
      refPath: "entityModel",
    },

    entityModel: {
      type: String,
      enum: ["User", "Post", "Comment", "Message"],
    },

    isSended: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.pre("find", function () {
  this.populate("entity");
});
notificationSchema.pre("findOne", function () {
  this.populate("entity");
});

module.exports = mongoose.model("Notifications", notificationSchema);
