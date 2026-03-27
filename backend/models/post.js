const mongoose = require("mongoose");

const postsSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Types.ObjectId, ref: "User", index: true },

    content: String,
    images: [String],

    likes: [{ type: mongoose.Types.ObjectId, ref: "User" }],

    commentsCount: { type: Number, default: 0 },

    visibility: {
      type: String,
      enum: ["PUBLIC", "PRIVATE"],
      default: "PUBLIC",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Posts", postsSchema);