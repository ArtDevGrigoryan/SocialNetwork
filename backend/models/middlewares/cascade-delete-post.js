const mongoose = require("mongoose");
const Likes = require("@models/like");
const Comments = require("@models/comment");
const Reposts = require("@models/repost");
const Saves = require("@models/saves");

module.exports = async function cascadeDeletePost(next) {
  const doc = this;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Promise.all([
        Comments.deleteMany({ post: doc._id }).session(session),
        Likes.deleteMany({ post: doc._id }).session(session),
        Reposts.deleteMany({ post: doc._id }).session(session),
        Saves.deleteMany({ post: doc._id }).session(session),
      ]);
    });
    next();
  } finally {
    await session.endSession();
  }
};
