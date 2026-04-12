const redis = require("@db/redis");
const PrivacyPolicy = require("./privacy");
const NotificationAggregator = require("@worker/notification/aggregator");
const socketService = require("@services/socket.service");
const Notification = require("@models/notification");
const { keys } = require("@helpers/utilities/create-cache-key");

const followKey = (toUser) =>
  keys({ type: "follow", entityId: toUser, toUser });
const requestKey = (toUser) =>
  keys({ type: "request", entityId: toUser, toUser });

class NotificationJobService {
  static async like(data) {
    const { postId, toUser } = data;
    const canSend = await PrivacyPolicy.chekNotificationSetting(toUser, "like");
    if (!canSend) return;

    const k = keys({ type: "like", entityId: postId, toUser });
    const { count, users } = await NotificationAggregator.consume(redis, {
      countKey: k.countKey,
      usersKey: k.usersKey,
    });
    if (!count) return;

    const notification = await Notification.findOneAndUpdate(
      { type: "LIKE", toUser, entity: postId, entityModel: "Post" },
      [
        {
          $set: {
            "meta.count": {
              $cond: [
                { $eq: ["$isRead", true] },
                count,
                { $add: ["$meta.count", count] },
              ],
            },
            "meta.users": users.slice(0, 3),
            isRead: false,
          },
        },
      ],
      { upsert: true, new: true },
    );

    await NotificationAggregator.clear(redis, [
      k.countKey,
      k.usersKey,
      k.scheduledKey,
    ]);
    await socketService.notify(notification);
  }

  static async "comment-batch"(data) {
    const { postId, toUser } = data;
    const canSend = await PrivacyPolicy.chekNotificationSetting(
      toUser,
      "comment",
    );
    if (!canSend) return;

    const k = keys({ type: "comment", entityId: postId, toUser });
    const { count, users } = await NotificationAggregator.consume(redis, {
      countKey: k.countKey,
      usersKey: k.usersKey,
    });
    if (!count) return;

    const notification = await Notification.findOneAndUpdate(
      { type: "COMMENT", toUser, entity: postId, entityModel: "Post" },
      [
        {
          $set: {
            "meta.count": {
              $cond: [
                { $eq: ["$isRead", true] },
                count,
                { $add: ["$meta.count", count] },
              ],
            },
            "meta.users": users.slice(0, 3),
            isRead: false,
          },
        },
      ],
      { upsert: true, new: true },
    );

    await NotificationAggregator.clear(redis, [
      k.countKey,
      k.usersKey,
      k.scheduledKey,
    ]);
    await socketService.notify(notification);
  }

  static async "follow-batch"(data) {
    const { toUser } = data;
    const canSend = await PrivacyPolicy.chekNotificationSetting(
      toUser,
      "follow",
    );
    if (!canSend) return;

    const k = followKey(toUser);
    const { count, users } = await NotificationAggregator.consume(redis, {
      countKey: k.countKey,
      usersKey: k.usersKey,
    });
    if (!count) return;

    const notification = await Notification.create({
      toUser,
      type: "FOLLOW",
      meta: NotificationAggregator.buildMeta(count, users),
    });

    await NotificationAggregator.clear(redis, [
      k.countKey,
      k.usersKey,
      k.scheduledKey,
    ]);
    await socketService.notify(notification);
  }

  static async "follow-request"(data) {
    const { toUser } = data;
    const canSend = await PrivacyPolicy.chekNotificationSetting(
      toUser,
      "follow_request",
    );
    if (!canSend) return;

    const k = requestKey(toUser);
    const { count, users } = await NotificationAggregator.consume(redis, {
      countKey: k.countKey,
      usersKey: k.usersKey,
    });
    if (!count) return;

    const notification = await Notification.findOneAndUpdate(
      { toUser, type: "REQUEST" },
      [
        {
          $set: {
            "meta.count": {
              $cond: [
                { $eq: ["$isRead", true] },
                count,
                { $add: ["$meta.count", count] },
              ],
            },
            "meta.users": users.slice(0, 3),
            isRead: false,
          },
        },
      ],
      { upsert: true, new: true },
    );

    await NotificationAggregator.clear(redis, [
      k.countKey,
      k.usersKey,
      k.scheduledKey,
    ]);
    await socketService.notify(notification);
  }

  static async message(data) {
    const { toUser, fromUser, messageId } = data;
    const canSend = await PrivacyPolicy.chekNotificationSetting(
      toUser,
      "message",
    );
    if (!canSend) return;

    const notification = await Notification.create({
      toUser,
      fromUser,
      type: "MESSAGE",
      entity: messageId,
      entityModel: "Message",
      meta: { count: 1, users: [fromUser] },
    });
    await socketService.notify(notification);
  }

  static async "accept-request"(data) {
    const { toUser, fromUser } = data;
    const canSend = await PrivacyPolicy.chekNotificationSetting(
      toUser,
      "accept_request",
    );
    if (!canSend) return;

    const notification = await Notification.create({
      toUser,
      fromUser,
      type: "ACCEPTED",
      meta: { count: 1, users: [fromUser] },
    });
    await socketService.notify(notification);
  }

  static async "decline-request"(data) {
    const { toUser, fromUser } = data;
    const canSend = await PrivacyPolicy.chekNotificationSetting(
      toUser,
      "decline_request",
    );
    if (!canSend) return;

    const k = requestKey(toUser);
    const { count, users } = await NotificationAggregator.consume(redis, {
      countKey: k.countKey,
      usersKey: k.usersKey,
    });
    if (!count) return;

    const notification = await Notification.create({
      toUser,
      fromUser,
      type: "DECLINED",
      meta: { count, users: users.slice(0, 3) },
    });
    await NotificationAggregator.clear(redis, [k.countKey, k.usersKey]);
    await socketService.notify(notification);
  }

  static async "cancel-request"(data) {
    const { toUser, fromUser } = data;
    const canSend = await PrivacyPolicy.chekNotificationSetting(
      toUser,
      "cancel_request",
    );
    if (!canSend) return;

    const k = requestKey(toUser);
    const { count, users } = await NotificationAggregator.consume(redis, {
      countKey: k.countKey,
      usersKey: k.usersKey,
    });
    if (!count) return;

    const notification = await Notification.create({
      toUser,
      fromUser,
      type: "REQUEST",
      meta: { count, users: users.slice(0, 3) },
    });
    await NotificationAggregator.clear(redis, [k.countKey, k.usersKey]);
    await socketService.notify(notification);
  }

  static async system(data) {
    const { toUser, message } = data;
    const notification = await Notification.create({
      toUser,
      type: "SYSTEM",
      meta: { count: 1, users: [], message },
    });
    await socketService.notify(notification);
  }

  static async unfollow(data) {
    const { toUser, fromUser } = data;
    const canSend = await PrivacyPolicy.chekNotificationSetting(
      toUser,
      "unfollow",
    );
    if (!canSend) return;
    await Notification.deleteOne({ toUser, fromUser, type: "FOLLOW" });
  }

  static async "group-message"(data) {
    const { chatId, fromUser, messageId } = data;
    const participantsWithSettings = await PrivacyPolicy.participantsSettings(
      chatId,
      [fromUser],
    );
    const filtered = participantsWithSettings
      .filter((p) => !p.isMuted && p.notificationSettings.message)
      .map((p) => p.user);

    const notifications = await Notification.insertMany(
      filtered.map((toUser) => ({
        toUser,
        fromUser,
        entity: messageId,
        entityModel: "Message",
      })),
    );
    await socketService.notifyMany(notifications);
  }

  static async "group-removed"(data) {
    const { chatId, fromUser } = data;
    const participantsWithSettings = await PrivacyPolicy.participantsSettings(
      chatId,
      [fromUser],
    );
    const filtered = participantsWithSettings
      .filter((p) => !p.isMuted && p.notificationSettings.group_removed)
      .map((p) => p.user);

    const notifications = await Notification.insertMany(
      filtered.map((toUser) => ({
        toUser,
        fromUser,
        type: "GROUP_REMOVED",
        entity: chatId,
        entityModel: "Chat",
      })),
    );
    await socketService.notifyMany(notifications);
  }

  static async "member-removed-notice"(data) {
    const { chatId, fromUser, removedUserId } = data;
    const participantsWithSettings = await PrivacyPolicy.participantsSettings(
      chatId,
      [fromUser, removedUserId],
    );
    const settingKey = "group_member_removed_notice";

    const filtered = participantsWithSettings
      .filter((p) => !p.isMuted && p.notificationSettings[settingKey])
      .map((p) => p.user);

    const notifications = await Notification.insertMany(
      filtered.map((toUser) => ({
        toUser,
        fromUser,
        type: "PARTICIPANT_REMOVED_NOTICE",
        entity: chatId,
        entityModel: "Chat",
        meta: { count: 1, users: [fromUser] },
      })),
    );
    await socketService.notifyMany(notifications);

    // Private member removed notice for the removed user
    await NotificationJobService.#memberRemoved({
      toUser: removedUserId,
      chatId,
      fromUser,
    });
  }
  static async "disjoin-group"(data) {
    const { chatId, fromUser, removedUserId } = data;

    const canSend = await PrivacyPolicy.checkParticipantNotification(
      removedUserId,
      chatId,
      "group_disjoin",
    );

    if (!canSend) return;

    const notification = await Notification.create({
      toUser: removedUserId,
      fromUser,
      type: "GROUP_DISJOIN",
      entity: chatId,
      entityModel: "Chat",
      meta: {
        count: 1,
        users: [fromUser],
      },
    });

    await socketService.notify(notification);
  }
  static async #memberRemoved(data) {
    const { toUser, chatId, fromUser } = data;
    const canSend = await PrivacyPolicy.checkParticipantNotification(
      toUser,
      chatId,
    );
    if (!canSend) return;

    const notification = await Notification.create({
      toUser,
      fromUser,
      type: "PARTICIPANT_REMOVED",
      entity: chatId,
      entityModel: "Chat",
      meta: { count: 1, users: [fromUser] },
    });
    await socketService.notify(notification);
  }

  static async "new-group"(data) {
    const { fromUser, chatId } = data;
    const participantsWithSettings = await PrivacyPolicy.participantsSettings(
      chatId,
      [fromUser],
    );
    const filtered = participantsWithSettings
      .filter((p) => !p.isMuted && p.notificationSettings.new_group)
      .map((p) => p.user);

    const notifications = await Notification.insertMany(
      filtered.map((toUser) => ({
        toUser,
        fromUser,
        entity: chatId,
        entityModel: "Chat",
        type: "NEW_GROUP",
      })),
    );
    await socketService.notifyMany(notifications);
  }

  static async "new-story"(data) {
    const { fromUser, storyId } = data;
    const notificationUsers = await PrivacyPolicy.checkNotificationFollowers(
      fromUser,
      "story",
    );
    const notifications = await Notification.insertMany(
      notificationUsers.map((toUser) => ({
        toUser,
        fromUser,
        entity: storyId,
        entityModel: "Story",
        type: "NEW_STORY",
      })),
    );
    await socketService.notifyMany(notifications);
  }

  static async "new-post"(data) {
    const { fromUser, postId } = data;
    const notificationUsers =
      await PrivacyPolicy.checkNotificationFollowers(fromUser);
    const notifications = await Notification.insertMany(
      notificationUsers.map((toUser) => ({
        toUser,
        fromUser,
        entity: postId,
        entityModel: "Post",
        type: "NEW_POST",
      })),
    );
    await socketService.notifyMany(notifications);
  }
}

module.exports = NotificationJobService;
