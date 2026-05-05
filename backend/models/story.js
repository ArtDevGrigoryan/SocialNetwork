const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mentions: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    media: {
      url: { type: String, required: true },
      key: { type: String, required: true },
      type: { type: String, enum: ["image", "video"], required: true },
      musicUrl: { type: String },
      musicTitle: { type: String },
      musicCover: { type: String },
      musicStartTime: { type: Number, default: 0 },
      musicDuration: { type: Number, default: 15 },
      isVideoMuted: { type: Boolean, default: false },
      musicWidget: {
        x: Number,
        y: Number,
        scale: Number,
        rotation: Number,
        isHidden: Boolean,
      },
      filter: { type: String, default: "none" },
      location: {
        name: String,
        x: Number,
        y: Number,
        scale: Number,
        rotation: Number,
      },
      linkSticker: {
        url: String,
        text: String,
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
          id: String,
          emoji: String,
          x: Number,
          y: Number,
          scale: Number,
          rotation: Number,
        },
      ],
      texts: [
        {
          id: String,
          content: String,
          color: String,
          fontFamily: String,
          x: Number,
          y: Number,
          scale: Number,
          rotation: Number,
        },
      ],
      mentionStickers: [
        {
          id: String,
          username: String,
          x: Number,
          y: Number,
          scale: Number,
          rotation: Number,
        },
      ],
      duration: Number,
      videoStartTime: Number,
      videoDuration: Number,
      thumbnail: String,
    },
    viewsCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: () => Date.now() + 24 * 60 * 60 * 1000 },
  },
  { timestamps: true },
);

storySchema.index({ user: 1, expiresAt: -1 });
storySchema.index({ expiresAt: -1 });
storySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Story", storySchema);
