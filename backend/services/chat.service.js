const mongoose = require("mongoose");
const Chat = require("@models/chat");
const Message = require("@models/message");
const sendMessageTx = require("@transaction/chat/message");
const readMessagesTx = require("@transaction/chat/read-messages");
const disjoinChatTx = require("@transaction/chat/disjoin-chat");
const removeUserTx = require("@transaction/chat/remove-user-from-group");
const deleteGroupTx = require("@transaction/chat/delete-group");
const createGroupTx = require("@transaction/chat/create-group");
const Participants = require("@models/participants");
const {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForBiddenException,
} = require("@helpers/errors");
const notificationService = require("@services/notification.service");
const PolicyService = require("@services/policy.service");

class ChatService {
  async searchChat(userId, text) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const regexp = new RegExp(text, "i");

    return Chat.aggregate([
      {
        $lookup: {
          from: "participants",
          localField: "_id",
          foreignField: "chatId",
          as: "participants",
        },
      },
      {
        $match: { "participants.user": userObjectId },
      },
      {
        $lookup: {
          from: "users",
          localField: "participants.user",
          foreignField: "_id",
          as: "users",
        },
      },
      {
        $match: {
          $or: [
            { groupName: { $regex: regexp } },
            { "users.username": { $regex: regexp } },
          ],
        },
      },
      {
        $lookup: {
          from: "participants",
          localField: "_id",
          foreignField: "chatId",
          as: "participants",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "participants.user",
          foreignField: "_id",
          as: "participantsUsers",
        },
      },
      {
        $addFields: {
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
        },
      },
      {
        $project: {
          groupName: 1,
          type: 1,
          participants: 1,
          lastMessage: 1,
          lastActivityAt: 1,
        },
      },
      {
        $sort: { lastActivityAt: -1 },
      },
    ]);
  }

  async getChats(userId, { limit = 20, cursor }) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const pipeline = [
      { $match: { user: userObjectId } },

      {
        $lookup: {
          from: "chats",
          localField: "chatId",
          foreignField: "_id",
          as: "chat",
        },
      },
      { $unwind: "$chat" },

      {
        $lookup: {
          from: "participants",
          localField: "chat._id",
          foreignField: "chatId",
          as: "chat.participants",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "chat.participants.user",
          foreignField: "_id",
          as: "allUsers",
        },
      },
      {
        $addFields: {
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
        },
      },

      {
        $lookup: {
          from: "messages",
          localField: "chat.lastMessage",
          foreignField: "_id",
          as: "chat.lastMessage",
        },
      },
      {
        $unwind: {
          path: "$chat.lastMessage",
          preserveNullAndEmptyArrays: true,
        },
      },

      { $sort: { "chat.lastActivityAt": -1, "chat._id": -1 } },
      { $limit: limit },

      {
        $project: {
          "chat.allUsers": 0,
        },
      },

      { $replaceRoot: { newRoot: "$chat" } },
    ];

    if (cursor) {
      const [lastActivityAt, lastId] = cursor.split("_");
      pipeline.unshift({
        $match: {
          user: userObjectId,
          "chat.lastActivityAt": { $lt: new Date(lastActivityAt) },
          "chat._id": { $lt: new mongoose.Types.ObjectId(lastId) },
        },
      });
    }

    const results = await Participants.aggregate(pipeline);

    const nextCursor =
      results.length > 0
        ? `${results[results.length - 1].lastActivityAt.getTime()}_${results[results.length - 1]._id}`
        : null;

    return { chats: results, nextCursor };
  }

  async find(userId, chatId) {
    await PolicyService.canAccessChat(userId, chatId);

    return Chat.findById(chatId)
      .populate({
        path: "pinned",
        populate: {
          path: "sender",
          select: "_id username avatar bio",
        },
      })
      .populate({
        path: "participants",
        populate: {
          path: "user",
          select: "_id username avatar bio",
        },
      });
  }

  async getAdmins(userId, chatId) {
    await PolicyService.canAccessChat(userId, chatId);
    return Participants.find({ chatId, role: "admin" }).populate(
      "user",
      "_id username avatar bio",
    );
  }

  async togglePinMsg(participantId, chatId, msg) {
    const isMember = await PolicyService.isMember(participantId, chatId);
    if (!isMember) {
      throw new ForBiddenException("User is not a member of this chat");
    }

    const message = await PolicyService.isChatMessage(msg, chatId);
    if (!message) {
      throw new NotFoundException("Message not found");
    }

    return Chat.findByIdAndUpdate(
      chatId,
      [
        {
          $set: {
            pinned: {
              $cond: [
                { $in: [msg, "$pinned"] },
                {
                  $filter: { input: "$pinned", cond: { $ne: ["$$this", msg] } },
                },
                { $concatArrays: ["$pinned", [msg]] },
              ],
            },
          },
        },
      ],
      { new: true },
    )
      .populate({
        path: "pinned",
        populate: { path: "sender", select: "_id username avatar bio" },
      })
      .populate({
        path: "participants",
        populate: { path: "user", select: "_id username avatar bio" },
      });
  }

  read(userId, chatId) {
    return readMessagesTx(userId, chatId);
  }

  async createDM(myId, targetId) {
    const isBlocked = await PolicyService.isBlocked(myId, targetId);
    if (isBlocked) throw new NotFoundException("User not found");

    const chatKey = [myId, targetId].sort().join(":");

    try {
      const chat = await Chat.create({ type: "dm", chatKey });

      await Participants.insertMany([
        { chatId: chat._id, user: myId },
        { chatId: chat._id, user: targetId },
      ]);

      return chat;
    } catch (err) {
      if (err.code === 11000) {
        return await Chat.findOne({ type: "dm", chatKey });
      }
      throw err;
    }
  }

  async createGroup(myId, data) {
    const { userIds } = data;
    const existings = await PolicyService.existUsers(userIds);

    const uniqueIds = [
      ...new Set([
        myId.toString(),
        ...existings.map((user) => user._id.toString()),
      ]),
    ];

    if (uniqueIds.length < 2) {
      throw new BadRequestException("At least 2 users required");
    }

    const update = { groupName: data.groupName || "New Group" };
    if (data.groupAvatar) update.groupAvatar = data.groupAvatar;

    const participants = uniqueIds.map((id) => ({
      user: id,
      role: id == myId ? "admin" : "member",
    }));

    const { chat } = await createGroupTx(participants, update);
    return chat;
  }

  async deleteGroup(userId, chatId) {
    await PolicyService.canRemoveGroup(userId, chatId);
    await deleteGroupTx(chatId);
    await notificationService.groupRemovedNotification({
      chatId,
      fromUser: userId,
    });
  }

  async removeUserFromGruop(removerParticipantId, chatId, participantId) {
    if (removerParticipantId.toString() === participantId.toString()) {
      throw new ConflictException("cannot remove yourself");
    }

    const { admin, removed } = await PolicyService.canRemoveMember(
      removerParticipantId,
      chatId,
      participantId,
    );

    await removeUserTx(participantId);
    await notificationService.memberRemovedNoticeNotification({
      chatId,
      fromUser: admin.user,
      removedUserId: removed.user,
    });
  }

  async disjoinChat(participantId, chatId) {
    const user = await PolicyService.canDisjoinChat(participantId, chatId);
    await disjoinChatTx(participantId, chatId);
    await notificationService.disjoinGroupNotification({
      chatId,
      removedUserId: user,
    });
  }

  async updateGroup(userId, chatId, data) {
    await PolicyService.canAccessChat(userId, chatId);

    const update = {};
    if (data.groupAvatar) update.groupAvatar = data.groupAvatar;
    if (data.groupName) update.groupName = data.groupName;

    return Chat.findByIdAndUpdate(chatId, update, { new: true })
      .populate({
        path: "pinned",
        populate: { path: "sender", select: "_id username avatar bio" },
      })
      .populate({
        path: "participants",
        populate: { path: "user", select: "_id username avatar bio" },
      });
  }
}

module.exports = new ChatService();
