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
      ],
    },

    entityId: mongoose.Types.ObjectId,

    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notifications", notificationSchema);
