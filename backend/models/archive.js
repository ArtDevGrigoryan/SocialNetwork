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
    mentions: [{ type: String }],
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
