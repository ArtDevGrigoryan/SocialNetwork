const AggregationBuilder = require("@models/aggregations/index");
const { ObjectId } = require("mongoose").Types;
const Post = require("@models/post");

class AggregationHelperPost {
  static #basePostsAggregation(builder, viewer, page = 1, limit = 20) {
    const viewerId = new ObjectId(viewer);
    const skip = (page - 1) * limit;

    return builder
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
        as: "viewerLikes",
      })
      .lookup({
        from: "saves",
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
        as: "viewerSaves",
      })
      .lookup({
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "authorData",
      })
      .addFields({
        viewer: {
          isLiked: { $gt: [{ $size: "$viewerLikes" }, 0] },
          isSaved: { $gt: [{ $size: "$viewerSaves" }, 0] },
        },
        isLiked: { $gt: [{ $size: "$viewerLikes" }, 0] },
        isSaved: { $gt: [{ $size: "$viewerSaves" }, 0] },
        author: { $arrayElemAt: ["$authorData", 0] },
      })
      .project({
        viewerLikes: 0,
        viewerSaves: 0,
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
        images:
          post.images?.map((img) => ({ url: img.url, filter: img.filter })) ||
          [],
      }));
  }

  static findPostsWithViewerLikes(viewer, author, page = 1, limit = 20) {
    const authorId = new ObjectId(author);
    const builder = new AggregationBuilder(Post).match({
      author: authorId,
      isArchived: false,
    });
    return this.#basePostsAggregation(
      builder,
      viewer,
      page,
      limit,
    ).execTransformed();
  }

  static findFeedPostsWithViewerLikes(viewer, authorIds, page = 1, limit = 20) {
    const validAuthorIds = authorIds.map((id) => new ObjectId(id));
    const builder = new AggregationBuilder(Post).match({
      author: { $in: validAuthorIds },
      isArchived: false,
    });
    return this.#basePostsAggregation(
      builder,
      viewer,
      page,
      limit,
    ).execTransformed();
  }

  static postWithViewerLikes(viewer, id) {
    const postId = new ObjectId(id);
    const builder = new AggregationBuilder(Post).match({ _id: postId });
    return this.#basePostsAggregation(builder, viewer, 1, 1).execTransformed();
  }
  static getExplorePosts(viewerId, excludedUserIds, skip, limit) {
    const builder = new AggregationBuilder(Post)
      .match({
        author: { $nin: excludedUserIds },
        isArchived: false,
      })
      .lookup({
        from: "settings",
        localField: "author",
        foreignField: "user",
        as: "authorSettings",
      })
      .addFields({
        profileVisibility: {
          $ifNull: [
            { $arrayElemAt: ["$authorSettings.privacy.profileVisibility", 0] },
            "PUBLIC",
          ],
        },
      })
      .match({
        profileVisibility: "PUBLIC",
      })
      .addFields({
        hoursSinceCreate: {
          $divide: [{ $subtract: [new Date(), "$createdAt"] }, 1000 * 60 * 60],
        },
      })
      .addFields({
        score: {
          $divide: [
            {
              $add: [
                { $multiply: [{ $ifNull: ["$likes", 0] }, 1.5] },
                { $multiply: [{ $ifNull: ["$comments", 0] }, 2] },
              ],
            },
            { $pow: [{ $add: ["$hoursSinceCreate", 2] }, 1.5] },
          ],
        },
      })
      .sort({ score: -1 })
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
        as: "viewerLikes",
      })
      .lookup({
        from: "saves",
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
        as: "viewerSaves",
      })
      .lookup({
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "authorData",
      })
      .addFields({
        viewer: {
          isLiked: { $gt: [{ $size: "$viewerLikes" }, 0] },
          isSaved: { $gt: [{ $size: "$viewerSaves" }, 0] },
        },
        isLiked: { $gt: [{ $size: "$viewerLikes" }, 0] },
        isSaved: { $gt: [{ $size: "$viewerSaves" }, 0] },
        author: { $arrayElemAt: ["$authorData", 0] },
      })
      .project({
        viewerLikes: 0,
        viewerSaves: 0,
        authorData: 0,
        authorSettings: 0,
        profileVisibility: 0,
        score: 0,
        hoursSinceCreate: 0,
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
        images:
          post.images?.map((img) => ({ url: img.url, filter: img.filter })) ||
          [],
      }));

    return builder.execTransformed();
  }
}

module.exports = AggregationHelperPost;
