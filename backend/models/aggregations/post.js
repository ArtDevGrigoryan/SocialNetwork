const AggregationBuilder = require("@models/aggregations/index");
const { ObjectId } = require("mongoose").Types;
const Post = require("@models/post");

class AggregationHelperPost {
  static findPostsWithViewerLikes(viewer, author, page = 1, limit = 20) {
    const viewerId = new ObjectId(viewer);
    const authorId = new ObjectId(author);
    const skip = (page - 1) * limit;

    return new AggregationBuilder(Post)
      .match({ author: authorId, isArchived: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lookup({
        from: "likes",
        localField: "_id",
        as: "viewerLikes",
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$postId", "$$local"] },
                  { $eq: ["$userId", viewerId] },
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
      .execTransformed();
  }

  static postWithViewerLikes(viewer, id) {
    const viewerId = new ObjectId(viewer);
    const postId = new ObjectId(id);

    return new AggregationBuilder(Post)
      .match({ _id: postId })
      .lookup({
        from: "likes",
        localField: "_id",
        as: "viewerLikes",
        pipeline: [
          { $match: { $expr: { $eq: ["$userId", viewerId] } } },
          { $project: { _id: 1 } },
        ],
      })
      .addFields({
        viewer: { isLiked: { $gt: [{ $size: "$viewerLikes" }, 0] } },
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
