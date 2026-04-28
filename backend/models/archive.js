const mongoose = require("mongoose");

const archiveStorySchema = new mongoose.Schema(
  {
    originalStoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    media: {
      url: { type: String, required: true },
      key: { type: String, required: true },
      type: { type: String, enum: ["image", "video"], required: true },
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
    viewsCount: { type: Number, default: 0 },
    createdAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    archivedAt: { type: Date, default: Date.now },
    isManualDelete: { type: Boolean, default: false },
    reactions: [
      {
        viewer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reaction: String,
        viewedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  },
);

archiveStorySchema.index({ user: 1, archivedAt: -1 });
archiveStorySchema.index({ expiresAt: 1 });
archiveStorySchema.index({ originalStoryId: 1 });

module.exports = mongoose.model("StoryArchive", archiveStorySchema);
