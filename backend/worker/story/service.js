const mongoose = require("mongoose");
const Story = require("@models/story");
const StoryViewer = require("@models/story-views");
const StoryArchive = require("@models/archive");

class StoryJobService {
  static async storyArchive(data) {
    const { storyId, isManualDelete = false } = data;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const story = await Story.findById(storyId).session(session);
      if (!story) {
        throw new Error(`Story not found: ${storyId}`);
      }

      const reactions = await StoryViewer.find({
        story: storyId,
        reaction: { $exists: true, $ne: null, $ne: "" },
      })
        .select("viewer reaction viewedAt")
        .lean()
        .session(session);

      await StoryArchive.create(
        [
          {
            originalStoryId: story._id,
            user: story.user,
            media: story.media,
            viewsCount: story.viewsCount || 0,
            createdAt: story.createdAt,
            expiresAt: story.expiresAt,
            reactions: reactions.map((r) => ({
              viewer: r.viewer,
              reaction: r.reaction,
              viewedAt: r.viewedAt,
            })),
            archivedAt: new Date(),
            isManualDelete,
          },
        ],
        { session },
      );

      await StoryViewer.deleteMany({ story: storyId }).session(session);
      await story.deleteOne({ session });

      await session.commitTransaction();

      console.log(
        `✅ Story archived: ${storyId} | Reactions saved: ${reactions.length}`,
      );
      return { success: true, storyId, reactionsCount: reactions.length };
    } catch (error) {
      await session.abortTransaction();
      console.error(`❌ Story archive failed for ${storyId}:`, error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async archiveExpired(data = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const now = new Date();

      const expiredStories = await Story.find({
        expiresAt: { $lte: now },
      })
        .select("_id user media viewsCount createdAt expiresAt")
        .lean()
        .session(session);

      if (expiredStories.length === 0) {
        await session.commitTransaction();
        return { processed: 0 };
      }

      console.log(
        `🕒 Found ${expiredStories.length} expired stories to archive`,
      );

      for (const story of expiredStories) {
        const reactions = await StoryViewer.find({
          story: story._id,
          reaction: { $exists: true, $ne: null, $ne: "" },
        })
          .select("viewer reaction viewedAt")
          .lean()
          .session(session);

        await StoryArchive.create(
          [
            {
              originalStoryId: story._id,
              user: story.user,
              media: story.media,
              viewsCount: story.viewsCount || 0,
              createdAt: story.createdAt,
              expiresAt: story.expiresAt,
              reactions: reactions.map((r) => ({
                viewer: r.viewer,
                reaction: r.reaction,
                viewedAt: r.viewedAt,
              })),
              archivedAt: now,
              isManualDelete: false,
            },
          ],
          { session },
        );

        await StoryViewer.deleteMany({ story: story._id }).session(session);
        await Story.deleteOne({ _id: story._id }).session(session);
      }

      await session.commitTransaction();
      console.log(
        `✅ Successfully archived ${expiredStories.length} expired stories`,
      );
      return { processed: expiredStories.length };
    } catch (error) {
      await session.abortTransaction();
      console.error("❌ archiveExpired job failed:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = StoryJobService;
