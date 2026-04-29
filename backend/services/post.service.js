const { ObjectId } = require("mongoose").Types;
const {
  NotFoundException,
  ConflictException,
  BadRequestException,
} = require("@helpers/errors");
const Likes = require("@models/like");
const Post = require("@models/post");
const Follow = require("@models/follow");
const Block = require("@models/blocked-user");
const mediaService = require("@lib/media.service");
const toggleLikeTx = require("@transaction/like-post");
const notificationService = require("./notification.service");
const socketService = require("@services/socket.service");
const PolicyService = require("@services/policy.service");
const AggreagtionHelperPost = require("@models/aggregations/post");

const safeJSONParse = (data, fallback = []) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Error parsing JSON data:", e.message);
    return fallback;
  }
};

class PostService {
  async create(user, files, data) {
    const {
      content,
      location,
      mentions,
      filters,
      musicUrl,
      musicTitle,
      musicStartTime,
    } = data;

    const uploadedImages = await mediaService.upload(files, "post");

    const parsedFilters = safeJSONParse(filters);
    const parsedMentions = safeJSONParse(mentions);

    const imagesWithFilters = uploadedImages.map((img, idx) => ({
      ...img,
      filter: parsedFilters[idx] || "none",
    }));

    const post = await Post.create({
      author: user,
      images: imagesWithFilters,
      content,
      location: location || "",
      mentions: parsedMentions,
      music: musicUrl
        ? {
            url: musicUrl,
            title: musicTitle,
            startTime: musicStartTime || 0,
          }
        : undefined,
    });
    await notificationService.newPostNotification({
      postId: post._id,
      fromUser: user,
    });

    for (const mentionedUser of parsedMentions) {
      await notificationService.mentionNotification({
        postId: post._id,
        fromUser: user,
        toUser: mentionedUser,
      });
    }

    return post;
  }

  async update(user, postId, data) {
    const isAuthor = await PolicyService.isPostAuthor(user, postId);
    if (!isAuthor) {
      throw new NotFoundException("Post not found");
    }
    const { files, content, location, mentions, filters } = data;
    const update = {};

    if (files && files.length) {
      const uploadedImages = await mediaService.upload(files, "post");
      let parsedFilters = [];
      if (filters) {
        try {
          parsedFilters = JSON.parse(filters);
        } catch (e) {}
      }
      const imagesWithFilters = uploadedImages.map((img, idx) => ({
        ...img,
        filter: parsedFilters[idx] || "none",
      }));

      update.$addToSet = {
        images: { $each: imagesWithFilters },
      };
    }

    if (content !== undefined) update.content = content;
    if (location !== undefined) update.location = location;
    if (mentions !== undefined) {
      try {
        update.mentions = JSON.parse(mentions);
      } catch (e) {}
    }

    return await Post.findOneAndUpdate(
      { _id: postId, author: user },
      { $set: update },
      { new: true },
    ).populate("author", "_id username bio avatar");
  }

  async getPosts(viewer, author, page = 1, limit = 20) {
    if (author) {
      await PolicyService.canViewProfile(viewer, author);
      return AggreagtionHelperPost.findPostsWithViewerLikes(
        viewer,
        author,
        page,
        limit,
      );
    }

    const following = await Follow.find({ follower: viewer })
      .select("following")
      .lean();
    const authorIds = [
      viewer.toString(),
      ...following.map((item) => item.following.toString()),
    ];

    return AggreagtionHelperPost.findFeedPostsWithViewerLikes(
      viewer,
      authorIds,
      page,
      limit,
    );
  }

  async getArchivedPosts(author, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return await Post.find({ author, isArchived: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "_id avatar username bio");
  }

  getSpecific(user, postId) {
    return PolicyService.canAccessPost(user, postId);
  }

  async deletePost(user, postId) {
    const userId = user._id.toString();
    const post = await Post.findById(postId).lean();

    if (!post) {
      throw new NotFoundException("Post not found");
    }
    if (post.author.toString() !== userId && user.role !== "admin") {
      throw new ConflictException("Cannot access to delete this post");
    }
    await mediaService.delete(post.images.map((img) => img.key));
    await Post.deleteOne({ _id: postId });
    return true;
  }

  async toggleLike(user, postId) {
    await PolicyService.canAccessPost(user, postId);
    const { liked, author } = await toggleLikeTx(user, postId);

    if (liked && author.toString() !== user.toString()) {
      notificationService.likeNotification({
        postId,
        fromUser: user,
        toUser: author,
      });
    }
    return { liked };
  }

  async toggleArchivePost(user, postId) {
    const post = await Post.findOneAndUpdate(
      { _id: postId, author: user },
      [
        {
          $set: {
            isArchived: { $not: "$isArchived" },
          },
        },
      ],
      { new: true, updatePipeline: true },
    ).populate("author", "_id avatar bio username");

    if (!post) {
      throw new BadRequestException("Something went wrong");
    }

    return post.isArchived ? null : post.toObject();
  }

  async removeImage(user, postId, url) {
    const post = await Post.findOne({
      _id: postId,
      author: user,
      "images.url": { $in: url },
    }).lean();
    if (!post) {
      throw new NotFoundException("Post not found");
    }
    if (user.toString() != post.author) {
      throw new ConflictException("Cannot access to delete this image");
    }
    const splitted = url.split("/");
    const [fname, ext] = splitted.at(-1).split(".");
    const key = splitted.at(-2) + "/" + fname;

    await mediaService.delete([key]);
    return await Post.findOneAndUpdate(
      { _id: postId, author: user },
      { $pull: { images: { key } } },
      { new: true },
    );
  }
  async toggleAccessRepost(userId, postId) {
    const post = await Post.findOneAndUpdate(
      { _id: postId, author: userId },
      [
        {
          $set: {
            accessRepost: { $not: "$accessRepost" },
          },
        },
      ],
      { returnDocument: "after", updatePipeline: true },
    );

    if (!post) {
      throw new NotFoundException("Post not found or no permission");
    }

    return post;
  }
  async postLikes(userId, postId, pagination) {
    await PolicyService.canAccessPost(userId, postId);
    const { limit, page } = pagination;
    const skip = (page - 1) * limit;
    const likedUsers = await Likes.find({ post: postId })
      .populate("user", "_id username avatar bio")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return likedUsers.map((liked) => liked.user);
  }
}

module.exports = new PostService();
