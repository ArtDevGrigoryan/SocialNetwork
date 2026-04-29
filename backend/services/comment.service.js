const Comment = require("@models/comment");
const Post = require("@models/post");
const PolicyService = require("@services/policy.service");
const { NotFoundException, ForBiddenException } = require("@helpers/errors");
const notificationService = require("./notification.service");

class CommentService {
  async add(author, postId, text) {
    const post = await PolicyService.canAccessPost(author, postId);
    const comm = await Comment.create({ author, post: postId, text });
    await Post.findByIdAndUpdate(postId, { $inc: { comments: 1 } });

    if (author != post.author._id) {
      await notificationService.commentNotification({
        postId,
        toUser: post.author._id,
        fromUser: author,
        commentId: comm._id,
      });
    }
    return await comm.populate("author", "_id username avatar bio");
  }
  async update(user, commentId, text) {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new NotFoundException("Comment not found");
    }

    if (comment.author.toString() !== user._id.toString()) {
      throw new ForBiddenException("Cannot update this comment");
    }

    await PolicyService.canAccessPost(user, comment.post);

    comment.text = text;
    await comment.save();

    await comment.populate("author", "_id username avatar bio");

    return comment;
  }
  async delete(user, commentId) {
    const comment = await Comment.findById(commentId).populate("post");

    if (!comment) {
      throw new NotFoundException("Comment not found");
    }

    const userId = user._id.toString();

    const isAuthor = userId === comment.author.toString();
    const isPostOwner = userId === comment.post.author.toString();
    const isAdmin = user.role === "admin";

    if (!isAuthor && !isPostOwner && !isAdmin) {
      throw new ForBiddenException("Cannot delete this comment");
    }

    await comment.deleteOne();
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { comments: -1 },
    });
    return true;
  }
  async comments(userId, postId, pagination) {
    await PolicyService.canAccessPost(userId, postId);
    const { limit = 20, page = 1 } = pagination;
    const skip = (page - 1) * limit;
    return Comment.find({ post: postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "_id username avatar bio");
  }
  myComments(userId, pagination) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    return Comment.find({ author: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }
}

module.exports = new CommentService();
