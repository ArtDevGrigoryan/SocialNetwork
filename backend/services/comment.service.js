const Comment = require("@models/comment");
const PolicyService = require("./policy.service");
const { NotFoundException, ForBiddenException } = require("@helpers/errors");

class CommentService {
  async add(author, postId, text) {
    await PolicyService.canAccessPost(author, postId);
    return (await Comment.create({ author, post: postId, text })).populate(
      "author",
      "_id username avatar bio",
    );
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
