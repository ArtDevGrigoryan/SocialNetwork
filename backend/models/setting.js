const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    notifications: {
      accept_request: { type: Boolean, default: true },
      decline_request: { type: Boolean, default: true },
      cancel_request: { type: Boolean, default: true },
      follow_request: { type: Boolean, default: true },
      follow: { type: Boolean, default: true },
      unfollow: { type: Boolean, default: true },
      group_member_removed: { type: Boolean, default: true },
      group_removed: { type: Boolean, default: true },
      group_member_removed_notice: { type: Boolean, default: true },
      message: { type: Boolean, default: true },
      like: { type: Boolean, default: true },
      new_group: { type: Boolean, default: true },
      new_post: { type: Boolean, default: true },
      new_story: { type: Boolean, default: false },
    },

    privacy: {
      profileVisibility: {
        type: String,
        enum: ["PUBLIC", "PRIVATE"],
        default: "PUBLIC",
      },

      showLastSeen: { type: Boolean, default: true },
      showTyping: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Setting", settingsSchema);
