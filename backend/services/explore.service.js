const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const AggregationHelperPost = require("@models/aggregations/post");
const Post = require("@models/post");
const Block = require("@models/blocked-user");

class ExploreService {
  async posts(userId, query) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const viewerId = new ObjectId(userId);

    const blocks = await Block.find({
      $or: [{ blocker: viewerId }, { blocked: viewerId }],
    }).lean();

    const excludedUserIds = blocks.map((b) =>
      b.blocker.equals(viewerId) ? b.blocked : b.blocker,
    );

    excludedUserIds.push(viewerId);

    const posts = await AggregationHelperPost.getExplorePosts(
      viewerId,
      excludedUserIds,
      skip,
      Number(limit),
    );

    return posts;
  }
}

module.exports = new ExploreService();
