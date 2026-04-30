const AggregationBuilder = require("./index");
const Chat = require("@models/chat");
const mongoose = require("mongoose");

class AggregationHelperChat {
  static searchChat(userId, text) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regexp = new RegExp(escapedText, "i");

    return new AggregationBuilder(Chat)
      .lookup({
        from: "participants",
        localField: "_id",
        foreignField: "chatId",
        as: "participants",
      })
      .match({ "participants.user": userObjectId })
      .lookup({
        from: "users",
        localField: "participants.user",
        foreignField: "_id",
        as: "users",
      })
      .match({
        $or: [
          { groupName: { $regex: regexp } },
          { "users.username": { $regex: regexp } },
        ],
      })
      .lookup({
        from: "participants",
        localField: "_id",
        foreignField: "chatId",
        as: "participants",
      })
      .lookup({
        from: "users",
        localField: "participants.user",
        foreignField: "_id",
        as: "participantsUsers",
      })
      .addFields({
        participantsUsers: {
          $map: {
            input: "$participantsUsers",
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
        participants: {
          $map: {
            input: "$participants",
            as: "p",
            in: {
              _id: "$$p._id",
              role: "$$p.role",
              unreadCount: "$$p.unreadCount",
              isMuted: "$$p.isMuted",
              participantName: "$$p.participantName",
              user: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$participantsUsers",
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
        localField: "pinned",
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
        as: "pinned",
      })
      .project({
        groupName: 1,
        type: 1,
        participants: 1,
        lastMessage: 1,
        lastActivityAt: 1,
        pinned: 1,
      })
      .sort({ lastActivityAt: -1 })
      .exec();
  }

  static myChats(userId) {
    return new AggregationBuilder(Chat)
      .lookup({
        from: "participants",
        let: { chatId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$chatId", "$$chatId"] },
                  { $eq: ["$user", userId] },
                ],
              },
            },
          },
          { $project: { _id: 1 } },
        ],
        as: "myParticipant",
      })
      .match({
        myParticipant: { $ne: [] },
      })
      .addFields({
        myParticipantId: { $arrayElemAt: ["$myParticipant._id", 0] },
      })
      .project({
        myParticipant: 0,
      })
      .exec();
  }
}

module.exports = AggregationHelperChat;
