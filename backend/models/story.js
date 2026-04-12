const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    media: {
      url: { type: String, required: true },
      key: { type: String, required: true },

      backgroundMusic: { type: String },

      type: {
        type: String,
        enum: ["image", "video"],
        required: true,
      },

      duration: Number,
      thumbnail: String,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },

    expiresAt: {
      type: Date,
      default: () => Date.now() + 24 * 60 * 60 * 1000,
    },
  },
  {
    timestamps: true,
  },
);

storySchema.index({ user: 1, expiresAt: -1 });
storySchema.index({ expiresAt: -1 });
storySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Story", storySchema);
