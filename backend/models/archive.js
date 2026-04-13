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
      backgroundMusic: String,
      type: { type: String, enum: ["image", "video"], required: true },
      duration: Number,
      thumbnail: String,
    },

    viewsCount: { type: Number, default: 0 },

    createdAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },

    archivedAt: { type: Date, default: Date.now },

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
