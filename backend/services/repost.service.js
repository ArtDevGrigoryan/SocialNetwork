const Repost = require("@models/repost");
const PolicyService = require("@services/policy.service");

class RepostService {
  async toggle(userId, postId) {
    const post = await PolicyService.canAccessRepost(userId, postId);

    const existing = await Repost.findOne({
      post: postId,
      user: userId,
    });

    if (existing) {
      await existing.deleteOne();
      return { action: "deleted", repost: null };
    }
    const repost = await Repost.create({
      post: postId,
      user: userId,
      author: post.author,
    });
    const populated = await repost.populate("post");
    return { action: "created", repost: populated };
  }
  myReposts(userId, pagination) {
    const { limit = 20, page = 1 } = pagination;
    const skip = (page - 1) * limit;
    return Repost.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("post");
  }
  repostsMyPost(userId, pagination) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    return Repost.find({ author: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "_id avatar username bio");
  }
  async findReposts(userId, authorId, pagination = {}) {
    await PolicyService.canViewProfile(userId, authorId);
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    return Repost.find({ user: authorId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("post")
      .populate("user", "_id avatar username bio");
  }
}

module.exports = new RepostService();
