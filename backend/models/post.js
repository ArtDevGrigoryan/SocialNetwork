const mongoose = require("mongoose");
const cascadeDeletePost = require("@mongoose-middleware/cascade-delete-post");

const imagesSchema = {
  url: { type: String, required: true },
  key: { type: String, required: true },
};

const postsSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Types.ObjectId, ref: "User", index: true },
    content: String,
    images: [imagesSchema],
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

postsSchema.pre(
  "deleteOne",
  { document: true, query: true },
  cascadeDeletePost,
);

module.exports = mongoose.model("Posts", postsSchema);
