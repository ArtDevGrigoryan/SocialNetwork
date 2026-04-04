const mongoose = require("mongoose");

const postsSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Types.ObjectId, ref: "User", index: true },

    content: String,
    images: [String],

    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },

    visibility: {
      type: String,
      enum: ["PUBLIC", "PRIVATE"],
      default: "PUBLIC",
    },
  },
  { timestamps: true },
);

postsSchema.pre("deleteOne", cascadeDeletePost);

module.exports = mongoose.model("Posts", postsSchema);
