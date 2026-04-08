const mongoose = require("mongoose");
const cascadeDeletePost = require("@mongoose-middleware/cascade-delete-post");
const postSchema = require("@schemas/post.schema");

const imagesSchema = {
  url: { type: String, required: true },
  key: { type: String, required: true },
  _id: false,
};

const postsSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Types.ObjectId, ref: "User", index: true },
    content: String,
    images: [imagesSchema],
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    isArchived: { type: Boolean, default: false },
    accessRepost: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toObject: { transform: docTransform },
    toJSON: { transform: docTransform },
  },
);

function docTransform(doc, ret) {
  if (ret.images) {
    ret.images = ret.images.map((img) => img.url);
  }
  return ret;
}

postsSchema.pre(
  "deleteOne",
  { document: true, query: true },
  cascadeDeletePost,
);

module.exports = mongoose.model("Posts", postsSchema);
