const Story = require("@models/story");
const StoryView = require("@models/story-views");
const Follow = require("@models/follow");
const PolicyService = require("./policy.service");
const mediaService = require("@lib/media.service");
const { NotFoundException, BadRequestException } = require("@helpers/errors");
const { feedStoryKey } = require("@utilities/create-cache-key");
const redis = require("@helpers/db/redis");

class StoryService {
  static STORY_TTL = 24 * 60 * 60 * 1000;
  static FEED_CACHE_TTL = 60 * 10;

  async stories(userId, { limit = 50 } = {}) {
    const now = new Date();

    let feedUsers = await redis.lrange(feedStoryKey(userId), 0, limit - 1);

    if (!feedUsers.length) {
      const followings = await Follow.find({ follower: userId })
        .select("following")
        .lean();

      feedUsers = followings.map((f) => f.following.toString());

      if (!feedUsers.length) return [];

      await redis.del(feedStoryKey(userId));
      await redis.lpush(feedStoryKey(userId), ...feedUsers);
      await redis.ltrim(feedStoryKey(userId), 0, limit - 1);
      await redis.expire(feedStoryKey(userId), StoryService.FEED_CACHE_TTL);
    }

    const stories = await Story.find({
      user: { $in: feedUsers },
      expiresAt: { $gt: now },
    })
      .populate("user", "_id username bio avatar")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    if (!stories.length) return [];

    const storyIds = stories.map((s) => s._id);

    const views = await StoryView.find({
      story: { $in: storyIds },
      viewer: userId,
    }).lean();

    const seenSet = new Set(views.map((v) => v.story.toString()));

    const grouped = new Map();

    for (const s of stories) {
      const uid = s.user._id.toString();

      const story = {
        ...s,
        viewer: { seen: seenSet.has(s._id.toString()) },
      };

      if (!grouped.has(uid)) grouped.set(uid, []);
      grouped.get(uid).push(story);
    }

    const result = [];

    for (const [, userStories] of grouped) {
      result.push({
        user: userStories[0].user,
        stories: userStories.slice(0, 10),
        hasUnseen: userStories.some((s) => !s.viewer.seen),
        lastStoryAt: userStories[0].createdAt,
      });
    }

    return result.sort((a, b) => {
      if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
      return b.lastStoryAt - a.lastStoryAt;
    });
  }

  async uniqueStory(viewer, storyId) {
    await PolicyService.canViewStory(viewer, storyId);

    const story = await Story.findById(storyId).populate(
      "user",
      "_id avatar bio username",
    );

    if (!story || story.expiresAt < new Date()) {
      throw new NotFoundException("Story not found");
    }

    const alreadyViewed = await StoryView.findOne({
      story: storyId,
      viewer,
    });

    if (!alreadyViewed) {
      await StoryView.create({
        story: storyId,
        viewer,
        viewedAt: new Date(),
      });

      await Story.updateOne({ _id: storyId }, { $inc: { viewsCount: 1 } });
    }

    return {
      ...story.toObject(),
      viewer: { seen: true },
    };
  }

  async guestStories(viewer, target) {
    await PolicyService.canViewProfile(viewer, target);

    const now = new Date();

    const stories = await Story.find({
      user: target,
      expiresAt: { $gt: now },
    })
      .populate("user", "_id avatar bio username")
      .sort({ createdAt: -1 })
      .lean();

    if (!stories.length) return [];

    const storyIds = stories.map((s) => s._id);

    const views = await StoryView.find({
      story: { $in: storyIds },
      viewer,
    }).lean();

    const seenSet = new Set(views.map((v) => v.story.toString()));

    return stories.map((s) => ({
      ...s,
      viewer: {
        seen: seenSet.has(s._id.toString()),
      },
    }));
  }

  async add(user, data, file) {
    const { type, musicUrl } = data;

    if (!["image", "video"].includes(type)) {
      throw new BadRequestException("Invalid media type");
    }

    const [uploaded] = await mediaService.upload(file, "story");

    const story = await Story.create({
      user,
      media: {
        key: uploaded.key,
        url: uploaded.url,
        backgroundMusic: musicUrl,
        type,
      },
      expiresAt: new Date(Date.now() + StoryService.STORY_TTL),
    });

    const followers = await Follow.find({ following: user })
      .select("follower")
      .lean();

    const pipeline = redis.pipeline();

    for (const f of followers) {
      pipeline.del(feedStoryKey(f.follower.toString()));
    }

    await pipeline.exec();

    return story;
  }

  async remove(user, storyId) {
    const story = await Story.findById(storyId);

    if (!story) throw new NotFoundException("Story not found");

    if (!story.user.equals(user._id) && user.role !== "admin") {
      throw new NotFoundException("Story not found");
    }
    const { key } = story.media;
    if (key) await mediaService.delete([key]);

    await StoryView.deleteMany({ story: storyId });
    await story.deleteOne();

    return true;
  }
}

module.exports = new StoryService();
