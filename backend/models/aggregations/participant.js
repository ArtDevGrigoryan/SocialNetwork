const AggregationBuilder = require("./index");
const Participants = require("@models/participants");
const mongoose = require("mongoose");

class AggregationHelperParticipant {
  static async getChats(userId, limit = 20, cursor) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const builder = new AggregationBuilder(Participants);

    builder
      .match({ user: userObjectId })
      .lookup({
        from: "chats",
        localField: "chatId",
        foreignField: "_id",
        as: "chat",
      })
      .unwind("$chat");

    // Սա լուծում է հին կոդի բագը, որտեղ chat.lastActivityAt-ը պտտվում էր դեռ lookup չարած
    if (cursor) {
      const [lastActivityAt, lastId] = cursor.split("_");
      builder.match({
        "chat.lastActivityAt": { $lt: new Date(lastActivityAt) },
        "chat._id": { $lt: new mongoose.Types.ObjectId(lastId) },
      });
    }

    builder
      .lookup({
        from: "participants",
        localField: "chat._id",
        foreignField: "chatId",
        as: "chat.participants",
      })
      .lookup({
        from: "users",
        localField: "chat.participants.user",
        foreignField: "_id",
        as: "allUsers",
      })
      .addFields({
        allUsers: {
          $map: {
            input: "$allUsers",
            as: "u",
            in: {
              _id: "$$u._id",
              username: "$$u.username",
              avatar: "$$u.avatar",
              bio: "$$u.bio",
            },
          },
        },
      })
      .addFields({
        "chat.participants": {
          $map: {
            input: "$chat.participants",
            as: "p",
            in: {
              _id: "$$p._id",
              role: "$$p.role",
              unreadCount: "$$p.unreadCount",
              isMuted: "$$p.isMuted",
              lastReadMessage: "$$p.lastReadMessage",
              participantName: "$$p.participantName",
              user: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$allUsers",
                      cond: { $eq: ["$$this._id", "$$p.user"] },
                    },
                  },
                  0,
                ],
              },
            },
          },
        },
      })
      .lookup({
        from: "messages",
        localField: "chat.lastMessage",
        foreignField: "_id",
        as: "chat.lastMessage",
      })
      .unwind({
        path: "$chat.lastMessage",
        preserveNullAndEmptyArrays: true,
      })
      .lookup({
        from: "messages",
        localField: "chat.pinned",
        foreignField: "_id",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "sender",
              foreignField: "_id",
              as: "sender",
            },
          },
          { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } },
          {
            $addFields: {
              sender: {
                _id: "$sender._id",
                username: "$sender.username",
                avatar: "$sender.avatar",
                bio: "$sender.bio",
              },
            },
          },
        ],
        as: "chat.pinned",
      })
      .sort({ "chat.lastActivityAt": -1, "chat._id": -1 })
      .limit(limit)
      .project({
        "chat.allUsers": 0,
      })
      .replaceRoot({ newRoot: "$chat" });

    return builder.exec();
  }

  static participantsSettings(chatIdObj, withoutObjs) {
    return new AggregationBuilder(Participants)
      .match({ chatId: chatIdObj, user: { $nin: withoutObjs } })
      .lookup({
        from: "settings",
        localField: "user",
        foreignField: "user",
        as: "setting",
      })
      .addFields({
        settings: { $arrayElemAt: ["$setting", 0] },
      })
      .project({
        user: 1,
        role: 1,
        isMuted: 1,
        participantName: 1,
        lastReadMessage: 1,
        unreadCount: 1,
        notificationSettings: "$settings.notifications",
      })
      .exec();
  }
}

module.exports = AggregationHelperParticipant;
