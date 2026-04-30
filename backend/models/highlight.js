const mongoose = require("mongoose");

const highlightSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: "Highlights",
    },
    cover: {
      type: String,
      required: true,
    },
    archives: [
      {
        type: mongoose.Types.ObjectId,
        ref: "StoryArchive",
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Highlight", highlightSchema);
