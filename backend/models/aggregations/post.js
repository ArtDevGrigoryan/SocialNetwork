const AggregationBuilder = require("@models/aggregations/index");
const { ObjectId } = require("mongoose").Types;
const Post = require("@models/post");

class AggregationHelperPost {
  static #basePostsAggregation(viewer, page = 1, limit = 20) {
    const viewerId = new ObjectId(viewer);
    const skip = (page - 1) * limit;

    return new AggregationBuilder(Post)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lookup({
        from: "likes",
        let: { postId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$post", "$$postId"] },
                  { $eq: ["$user", viewerId] },
                ],
              },
            },
          },
          { $project: { _id: 1 } },
        ],
      })
      .lookup({
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "authorData",
      })
      .addFields({
        viewer: { isLiked: { $gt: [{ $size: "$viewerLikes" }, 0] } },
        isLiked: { $gt: [{ $size: "$viewerLikes" }, 0] },
        author: { $arrayElemAt: ["$authorData", 0] },
      })
      .project({
        viewerLikes: 0,
        authorData: 0,
        "author.email": 0,
        "author.password": 0,
        "author.token": 0,
        "author.followersCount": 0,
        "author.followingCount": 0,
        "author.__v": 0,
        "author.deactived": 0,
        "author.createdAt": 0,
        "author.updatedAt": 0,
        "author.role": 0,
        "author.status": 0,
      })
      .transform((post) => ({
        ...post,
        images: post.images?.map((img) => img.url) || [],
      }))
  }

  static findPostsWithViewerLikes(viewer, author, page = 1, limit = 20) {
    const authorId = new ObjectId(author);
    return this.#basePostsAggregation(viewer, page, limit)
      .match({ author: authorId, isArchived: false })
      .execTransformed();
  }

  static findFeedPostsWithViewerLikes(viewer, authorIds, page = 1, limit = 20) {
    const validAuthorIds = authorIds.map((id) => new ObjectId(id));
    return this.#basePostsAggregation(viewer, page, limit)
      .match({ author: { $in: validAuthorIds }, isArchived: false })
      .execTransformed();
  }

  static postWithViewerLikes(viewer, id) {
    const viewerId = new ObjectId(viewer);
    const postId = new ObjectId(id);

    return new AggregationBuilder(Post)
      .match({ _id: postId })
      .lookup({
        from: "likes",
        let: { postId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$post", "$$postId"] },
                  { $eq: ["$user", viewerId] },
                ],
              },
            },
          },
          { $project: { _id: 1 } },
        ],
      })
      .addFields({
        viewer: { isLiked: { $gt: [{ $size: "$viewerLikes" }, 0] } },
        isLiked: { $gt: [{ $size: "$viewerLikes" }, 0] },
      })
      .project({
        viewerLikes: 0,
      })
      .transform((post) => ({
        ...post,
        images: post.images?.map((img) => img.url) || [],
      }))
      .execTransformed();
  }
}

module.exports = AggregationHelperPost;
