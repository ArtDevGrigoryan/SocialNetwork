const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "User", index: true },

    type: {
      type: String,
      enum: ["LIKE", "FOLLOW", "MESSAGE", "COMMENT"],
    },

    data: Object,

    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notifications", notificationSchema);