const { ObjectId } = require("mongoose").Types;
const {
  NotFoundException,
  ConflictException,
  BadRequestException,
} = require("@helpers/errors");
const Post = require("@models/post");
const Block = require("@models/blocked-user");
const mediaService = require("@lib/media.service");
const toggleLikeTx = require("@transaction/like-post");
const notificationService = require("./notification.service");
const socketService = require("@services/socket.service");
const PolicyService = require("@services/policy.service");
const AggreagtionHelperPost = require("@models/aggregations/post");

class PostService {
  async create(user, files, content) {
    const result = await mediaService.upload(files, "post");
    const post = await Post.create({ author: user, images: result, content });
    return post;
  }
  async update(user, postId, data) {
    const isAuthor = await PolicyService.isPostAuthor(user, postId);
    if (!isAuthor) {
      throw new NotFoundException("Post not found");
    }
    const { files, content } = data;
    const update = {};
    if (files && files.length) {
      const result = await mediaService.upload(files, "post");
      update.$addToSet = {
        images: { $each: result },
      };
    }
    if (content) {
      update.$set = {
        content,
      };
    }
    return await Post.findOneAndUpdate({ _id: postId, author: user }, update, {
      new: true,
    }).populate("author", "_id username bio avatar");
  }
  async getPosts(viewer, author, page = 1, limit = 20) {
    await PolicyService.canViewProfile(viewer, author);
    return AggreagtionHelperPost.findPostsWithViewerLikes(
      viewer,
      author,
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
    if (post.author.toString() != userId && user.role != "admin") {
      throw new ConflictException("Cannot access delete this post");
    }
    await mediaService.delete(post.images.map((img) => img.key));
    await Post.deleteOne({ _id: postId });
    return true;
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
  async toggleLike(user, postId) {
    await PolicyService.canAccessPost(user, postId);
    const { liked, author } = await toggleLikeTx(user, postId);

    if (liked && author.toString() != user)
      eventBus.emitEvent("like", {
        user: author,
        entity: user,
        entityModel: "User",
      });
    return { liked };
  }
  async toggleAccessRepost(userId, postId) {
    const post = await Post.findOneAndUpdate(
      { _id: postId, author: userId },
      { $bit: { accessRepost: { xor: 1 } } },
      { returnDocument: "after" },
    );

    if (!post) {
      throw new NotFoundException("Post not found or no permission");
    }

    return post;
  }
}

module.exports = new PostService();
