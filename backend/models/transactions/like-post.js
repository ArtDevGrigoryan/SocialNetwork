const mongoose = require("mongoose");
const Post = require("@models/post");
const Like = require("@models/like");

module.exports = async function toggleLike(userId, postId) {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const result = await Like.updateOne(
        { user: userId, post: postId },
        { $setOnInsert: { user: userId, post: postId } },
        { upsert: true, session },
      );

      let liked;
      let post;
      if (result.upsertedCount === 1) {
        liked = true;

        post = await Post.findOneAndUpdate(
          { _id: postId },
          { $inc: { likes: 1 } },
          { session },
        );
      } else {
        await Like.deleteOne({ user: userId, post: postId }, { session });

        liked = false;

        post = await Post.findOneAndUpdate(
          { _id: postId },
          { $inc: { likes: -1 } },
          { session },
        );
      }

      return { liked, author: post.author };
    });
  } finally {
    await session.endSession();
  }
};
