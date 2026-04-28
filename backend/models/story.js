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
      type: {
        type: String,
        enum: ["image", "video"],
        required: true,
      },
      musicUrl: { type: String },
      musicTitle: { type: String },
      musicStartTime: { type: Number, default: 0 },
      musicDuration: { type: Number, default: 15 },
      filter: { type: String, default: "none" },
      location: {
        name: String,
        x: Number,
        y: Number,
        scale: Number,
        rotation: Number,
      },
      transform: {
        scale: { type: Number, default: 1 },
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
      },
      stickers: [
        {
          emoji: String,
          x: Number,
          y: Number,
          scale: Number,
          rotation: Number,
        },
      ],
      texts: [
        {
          content: String,
          color: String,
          fontFamily: String,
          x: Number,
          y: Number,
          scale: Number,
          rotation: Number,
        },
      ],
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
