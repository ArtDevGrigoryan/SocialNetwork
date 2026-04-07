const {
  NotFoundException,
  ConflictException,
  BadRequestException,
} = require("@helpers/errors");
const Post = require("@models/post");
const Block = require("@models/blocked-user");
const mediaService = require("@services/stroj-media.service");
const toggleLikeTx = require("@transaction/like-post");
const notificationService = require("./notification.service");
const socketService = require("./socket.service");
const PolicyService = require("./policy.service");
const eventBus = require("./event-bus");

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
    }).lean();
  }
  async getPosts(viewer, author, page = 1, limit = 20) {
    await PolicyService.canViewProfile(viewer, author);
    const skip = (page - 1) * limit;
    const posts = await Post.find({ author, isArchived: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (user.toString() != author) {
      const block = await Block.findOne({ blocker: author, blocked: user });
      if (block) {
        throw new ConflictException("Cannot access in posts");
      }
    }
    return posts;
  }
  async getArchivedPosts(author, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return await Post.find({ author, isArchived: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }
  getSpecific(user, postId) {
    return PolicyService.canAccessPost(user, postId);
  }
  async deletePost(user, postId) {
    const userId = user._id.toString();
    const post = await Post.findById(postId);
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
      { new: true },
    ).lean();

    if (!post) {
      throw new BadRequestException("Something went wrong");
    }

    return post.isArchived ? null : post;
  }
  async removeImage(user, postId, key) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new NotFoundException("Post not found");
    }
    if (user.toString() != post.author) {
      throw new ConflictException("Cannot access to delete this image");
    }
    await mediaService.delete([key]);
    return await Post.findOneAndUpdate(
      { _id: postId, author: user },
      { $pull: { images: { key: key } } },
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
}

module.exports = new PostService();
