const mongoose = require("mongoose");

const storyViewerSchema = new mongoose.Schema(
  {
    story: {
      type: mongoose.Types.ObjectId,
      ref: "Story",
      required: true,
    },

    viewer: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reaction: String,
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  },
);

storyViewerSchema.index({ story: 1, viewer: 1 }, { unique: true });
storyViewerSchema.index({ story: 1, viewedAt: -1 });
storyViewerSchema.index({ viewer: 1, viewedAt: -1 });

module.exports = mongoose.model("StoryViewer", storyViewerSchema);
