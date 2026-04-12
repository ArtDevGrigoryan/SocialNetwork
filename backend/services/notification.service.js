const redis = require("@db/redis");
const notificationQueue = require("@worker/notification/queue");
const { keys } = require("@utilities/create-cache-key");
const JOBS = require("@constants/notification-job-names");

class NotificationService {
  static LOCK_TTL = 5;

  static async #enqueueOnce({ scheduledKey, jobName, payload, delayMs = 0 }) {
    const locked = await redis.set(
      scheduledKey,
      "1",
      "NX",
      "EX",
      NotificationService.LOCK_TTL,
    );

    if (!locked) return;

    await notificationQueue.add(jobName, payload, {
      removeOnComplete: true,
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      delay: delayMs,
    });
  }

  async likeNotification({ postId, fromUser, toUser }) {
    if (fromUser === toUser) return;
    const { scheduledKey, usersKey, countKey } = keys({
      type: "like",
      entityId: postId,
      toUser,
    });
    await Promise.all([redis.sadd(usersKey, fromUser), redis.incr(countKey)]);
    await NotificationService.#enqueueOnce({
      scheduledKey,
      jobName: JOBS.LIKE,
      payload: { postId, toUser },
    });
  }

  async commentNotification({ postId, fromUser, toUser }) {
    if (fromUser === toUser) return;
    const { scheduledKey, usersKey, countKey } = keys({
      type: "comment",
      entityId: postId,
      toUser,
    });
    await Promise.all([redis.sadd(usersKey, fromUser), redis.incr(countKey)]);
    await NotificationService.#enqueueOnce({
      scheduledKey,
      jobName: JOBS.COMMENT,
      payload: { postId, toUser },
    });
  }

  async followNotification({ fromUser, toUser }) {
    if (fromUser === toUser) return;
    const { scheduledKey, usersKey, countKey } = keys({
      type: "follow",
      entityId: toUser,
      toUser,
    });
    await Promise.all([redis.sadd(usersKey, fromUser), redis.incr(countKey)]);
    await NotificationService.#enqueueOnce({
      scheduledKey,
      jobName: JOBS.FOLLOW,
      payload: { toUser },
    });
  }

  async followRequestNotification({ fromUser, toUser }) {
    if (fromUser === toUser) return;
    const { scheduledKey, usersKey, countKey } = keys({
      type: "request",
      entityId: toUser,
      toUser,
    });
    await Promise.all([redis.sadd(usersKey, fromUser), redis.incr(countKey)]);
    await NotificationService.#enqueueOnce({
      scheduledKey,
      jobName: JOBS.FOLLOW_REQUEST,
      payload: { toUser },
    });
  }

  async acceptRequestNotification({ fromUser, toUser }) {
    if (fromUser === toUser) return;
    await notificationQueue.add(
      JOBS.ACCEPT_REQUEST,
      { fromUser, toUser },
      {
        removeOnComplete: true,
        attempts: 3,
      },
    );
  }

  async declineRequestNotification({ fromUser, toUser }) {
    if (fromUser === toUser) return;
    await notificationQueue.add(
      JOBS.DECLINE_REQUEST,
      { fromUser, toUser },
      {
        removeOnComplete: true,
        attempts: 3,
      },
    );
  }

  async cancelRequestNotification({ fromUser, toUser }) {
    if (fromUser === toUser) return;
    await notificationQueue.add(
      JOBS.CANCEL_REQUEST,
      { fromUser, toUser },
      {
        removeOnComplete: true,
        attempts: 3,
      },
    );
  }

  async unfollowNotification({ fromUser, toUser }) {
    if (fromUser === toUser) return;
    await notificationQueue.add(
      JOBS.UNFOLLOW,
      { fromUser, toUser },
      {
        removeOnComplete: true,
        attempts: 3,
      },
    );
  }

  async messageNotification({ fromUser, toUser, messageId }) {
    if (fromUser === toUser) return;
    await notificationQueue.add(
      JOBS.MESSAGE,
      { fromUser, toUser, messageId },
      {
        removeOnComplete: true,
        attempts: 3,
      },
    );
  }

  async systemNotification({ toUser, message }) {
    await notificationQueue.add(
      JOBS.SYSTEM,
      { toUser, message },
      {
        removeOnComplete: true,
      },
    );
  }

  async groupMessageNotification({ chatId, fromUser, messageId }) {
    await notificationQueue.add(
      JOBS.GROUP_MESSAGE,
      { chatId, fromUser, messageId },
      {
        removeOnComplete: true,
        attempts: 3,
      },
    );
  }

  async groupRemovedNotification({ chatId, fromUser }) {
    await notificationQueue.add(
      JOBS.GROUP_REMOVED,
      { chatId, fromUser },
      {
        removeOnComplete: true,
        attempts: 3,
      },
    );
  }

  async memberRemovedNoticeNotification({ chatId, fromUser, removedUserId }) {
    await notificationQueue.add(
      JOBS.MEMBER_REMOVED_NOTICE,
      { chatId, fromUser, removedUserId },
      {
        removeOnComplete: true,
        attempts: 3,
      },
    );
  }

  async newGroupNotification({ fromUser, chatId }) {
    await notificationQueue.add(
      JOBS.NEW_GROUP,
      { fromUser, chatId },
      {
        removeOnComplete: true,
        attempts: 3,
      },
    );
  }

  async newStoryNotification({ fromUser, storyId }) {
    await notificationQueue.add(
      JOBS.NEW_STORY,
      { fromUser, storyId },
      {
        removeOnComplete: true,
        attempts: 3,
      },
    );
  }

  async newPostNotification({ fromUser, postId }) {
    await notificationQueue.add(
      JOBS.NEW_POST,
      { fromUser, postId },
      {
        removeOnComplete: true,
        attempts: 3,
      },
    );
  }
  async disjoinGroupNotification({ chatId, removedUserId }) {
    await notificationQueue.add(
      JOBS.DISJOIN_GROUP,
      { chatId, fromUser: removedUserId },
      {
        removeOnComplete: true,
        attempts: 3,
      },
    );
  }
}

module.exports = new NotificationService();
