const PolicyService = require("@services/policy.service");
const Like = require("@models/like");

class LikeService {
  async postLikes(userId, postId, pagination) {
    await PolicyService.canAccessPost(userId, postId);
    const { limit = 20, page = 1 } = pagination;
    const skip = (page - 1) * limit;
    return await Like.find({ post: postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "_id username avatar bio");
  }
  async myLikes(userId, pagination) {
    const { limit = 20, page = 1 } = pagination;
    const skip = (page - 1) * limit;
    return await Like.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("post");
  }
  async search(userId, postId, text) {
    await PolicyService.canAccessPost(userId, postId);
    const search = new RegExp(text, "i");

    return Like.find({ post: postId }).populate({
      path: "user",
      match: { username: search },
      select: "_id username avatar bio",
    });
  }
}

module.exports = new LikeService();
