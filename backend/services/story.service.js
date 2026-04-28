const Story = require("@models/story");
const StoryView = require("@models/story-views");
const Follow = require("@models/follow");
const PolicyService = require("./policy.service");
const mediaService = require("@lib/media.service");
const { NotFoundException, BadRequestException } = require("@helpers/errors");
const { feedStoryKey } = require("@utilities/create-cache-key");
const redis = require("@helpers/db/redis");
const notificationService = require("./notification.service");

class StoryService {
  static STORY_TTL = 24 * 60 * 60 * 1000;
  static FEED_CACHE_TTL = 60 * 10;

  static mapStoryForFrontend(s, viewData) {
    return {
      ...s,
      mediaUrl: s.media.url,
      type: s.media.type,
      musicUrl: s.media.musicUrl,
      musicTitle: s.media.musicTitle,
      musicStartTime: s.media.musicStartTime,
      musicDuration: s.media.musicDuration,
      filter: s.media.filter,
      location: s.media.location,
      transform: s.media.transform,
      stickers: s.media.stickers,
      texts: s.media.texts,
      viewer: {
        seen: !!viewData,
        liked: viewData?.liked || false,
        reaction: viewData?.reaction || null,
      },
    };
  }

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

    const viewMap = new Map(views.map((v) => [v.story.toString(), v.reaction]));
    const grouped = new Map();

    for (const s of stories) {
      const uid = s.user._id.toString();
      const viewData = viewMap.get(s._id.toString());
      const mappedStory = StoryService.mapStoryForFrontend(s, viewData);

      if (!grouped.has(uid)) grouped.set(uid, []);
      grouped.get(uid).push(mappedStory);
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

    return StoryService.mapStoryForFrontend(story.toObject(), alreadyViewed);
  }

  async getStoryViewers(userId, storyId) {
    const story = await Story.findById(storyId);

    if (!story) throw new NotFoundException("Story not found");

    if (story.user.toString() !== userId.toString()) {
      throw new BadRequestException(
        "You can only view viewers of your own story",
      );
    }

    const viewers = await StoryView.find({ story: storyId })
      .populate("viewer", "_id username avatar")
      .sort({ viewedAt: -1 })
      .lean();

    return viewers;
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

    const viewMap = new Map(views.map((v) => [v.story.toString(), v]));

    return stories.map((s) => {
      const viewData = viewMap.get(s._id.toString());
      return StoryService.mapStoryForFrontend(s, viewData);
    });
  }

  async add(user, data, file) {
    const {
      type,
      musicUrl,
      musicTitle,
      musicStartTime,
      musicDuration,
      filter,
      location,
      transform,
      stickers,
      texts,
    } = data;

    if (!["image", "video"].includes(type)) {
      throw new BadRequestException("Invalid media type");
    }

    let parsedTransform = { scale: 1, x: 0, y: 0 };
    let parsedStickers = [];
    let parsedTexts = [];
    let parsedLocation = null;

    try {
      if (transform) parsedTransform = JSON.parse(transform);
      if (stickers) parsedStickers = JSON.parse(stickers);
      if (texts) parsedTexts = JSON.parse(texts);
      if (location) parsedLocation = JSON.parse(location);
    } catch (err) {
      console.error("Story media parsing error:", err);
    }

    const [uploaded] = await mediaService.upload(file, "story");

    const story = await Story.create({
      user,
      media: {
        key: uploaded.key,
        url: uploaded.url,
        type,
        musicUrl: musicUrl !== "none" ? musicUrl : null,
        musicTitle: musicTitle || null,
        musicStartTime: musicStartTime ? Number(musicStartTime) : 0,
        musicDuration: musicDuration ? Number(musicDuration) : 15,
        filter: filter || "none",
        location: parsedLocation,
        transform: parsedTransform,
        stickers: parsedStickers,
        texts: parsedTexts,
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
    await notificationService.newStoryNotification({
      storyId: story._id,
      fromUser: user,
    });

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

  async reaction(userId, storyId, reaction) {
    await PolicyService.canViewStory(userId, storyId);

    const viewer = await StoryView.findOneAndUpdate(
      {
        story: storyId,
        viewer: userId,
      },
      { reaction },
      { new: true, upsert: true },
    ).lean();
    return viewer;
  }

  async like(userId, storyId) {
    await PolicyService.canViewStory(userId, storyId);

    const story = await Story.findById(storyId);

    if (!story) throw new NotFoundException("Story not found");

    const storyView = await StoryView.findOneAndUpdate(
      {
        story: storyId,
        viewer: userId,
      },
      { liked: true },
      { new: true, upsert: true },
    );
    await notificationService.likeNotification({
      storyId,
      fromUser: userId,
      toUser: story.user,
    });
    return storyView;
  }
}

module.exports = new StoryService();
