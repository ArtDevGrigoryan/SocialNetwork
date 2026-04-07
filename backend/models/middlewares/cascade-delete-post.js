const mongoose = require("mongoose");
const Likes = require("@models/like");
const Comments = require("@models/comment");
const Reposts = require("@models/repost");
const Saves = require("@models/saves");
const Post = require("@models/post");

module.exports = async function cascadeDelete(next) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      let postIds = [];

      if (this instanceof mongoose.Model) {
        postIds.push(this._id);
      } else {
        const docs = await this.model
          .find(this.getFilter())
          .select("_id")
          .session(session);
        postIds = docs.map((d) => d._id);
      }

      if (postIds.length > 0) {
        await Promise.all([
          Comments.deleteMany({ post: { $in: postIds } }).session(session),
          Likes.deleteMany({ post: { $in: postIds } }).session(session),
          Reposts.deleteMany({ post: { $in: postIds } }).session(session),
          Saves.deleteMany({ post: { $in: postIds } }).session(session),
        ]);
      }
    });

    next();
  } finally {
    await session.endSession();
  }
}

