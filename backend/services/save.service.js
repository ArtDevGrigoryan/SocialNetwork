const { BadRequestException, NotFoundException } = require("@helpers/errors");
const PolicyService = require("@services/policy.service");
const Saves = require("@models/saves");

class SaveService {
  async add(userId, postId) {
    await PolicyService.canAccessPost(userId, postId);
    const exist = await Saves.findOne({ user: userId, post: postId });
    if (exist) {
      throw new BadRequestException("Post already saves");
    }
    return (await Saves.create({ user: userId, post: postId })).populate(
      "post",
    );
  }
  async remove(userId, postId) {
    const deleted = await Saves.findOneAndDelete({
      user: userId,
      post: postId,
    });
    if (!deleted) {
      throw new NotFoundException("Saved post not found");
    }
    return null;
  }
  saves(userId, pagination) {
    const { limit = 20, page = 1 } = pagination;
    const skip = (page - 1) * limit;
    return Saves.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("post");
  }
}

module.exports = new SaveService();
