const mongoose = require("mongoose");
const Setting = require("@models/setting");
const Follow = require("@models/follow");
const Participant = require("@models/participants");
const Chat = require("@models/chat");

class PrivacyPolicy {
  static async chekNotificationSetting(userId, prop) {
    const setting = await Setting.findOne({
      user: userId,
    }).lean();

    if (!setting) return false;
    return !!setting?.notifications?.[prop];
  }

  static async participantsSettings(chatId, without = []) {
    const chatIdObj = new mongoose.Types.ObjectId(chatId);
    const withoutObjs = without.map((id) => new mongoose.Types.ObjectId(id));

    return await Participant.aggregate([
      { $match: { chatId: chatIdObj, user: { $nin: withoutObjs } } },
      {
        $lookup: {
          from: "settings",
          localField: "user",
          foreignField: "user",
          as: "setting",
        },
      },
      {
        $addFields: {
          settings: { $arrayElemAt: ["$setting", 0] },
        },
      },
      {
        $project: {
          user: 1,
          role: 1,
          isMuted: 1,
          participantName: 1,
          lastReadMessage: 1,
          unreadCount: 1,
          notificationSettings: "$settings.notifications",
        },
      },
    ]);
  }

  static async checkNotificationFollowers(fromUser, action = "post") {
    const key = action === "post" ? "new_post" : "new_story";

    const myParticipants = await Participant.find({ user: fromUser })
      .sort({ createdAt: -1 })
      .limit(30)
      .select("chatId")
      .lean();

    const chatIds = myParticipants.map((p) => p.chatId);

    if (!chatIds.length) return [];

    const participants = await Participant.find({
      chatId: { $in: chatIds },
      user: { $ne: fromUser },
    })
      .select("user")
      .lean();

    const userIds = [...new Set(participants.map((p) => p.user.toString()))];

    if (!userIds.length) return [];

    const follows = await Follow.find({
      following: fromUser,
      follower: { $in: userIds },
      [`notifications.${key}`]: { $ne: false },
    })
      .select("follower")
      .lean();

    const followSet = new Set(follows.map((f) => f.follower.toString()));

    const settings = await Setting.find({
      user: { $in: userIds },
      [`notifications.${key}`]: true,
    })
      .select("user")
      .lean();

    const settingsSet = new Set(settings.map((s) => s.user.toString()));

    const finalUsers = userIds.filter(
      (id) => followSet.has(id) && settingsSet.has(id),
    );

    return finalUsers;
  }

  static async checkParticipantNotification(userId, chatId, prop) {
    const participant = await Participant.findOne({
      user: userId,
      chatId,
    }).lean();
    if (!participant) return false;

    const settings = await Setting.findOne({ user: userId });

    return Boolean(!participant.isMuted && settings?.notifications?.[prop]);
  }
}

module.exports = PrivacyPolicy;
