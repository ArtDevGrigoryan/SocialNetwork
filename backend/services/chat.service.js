const mongoose = require("mongoose");
const Chat = require("@models/chat");
const Message = require("@models/message");
const sendMessageTx = require("@transaction/chat/message");
const readMessagesTx = require("@transaction/chat/read-messages");
const disjoinChatTx = require("@transaction/chat/disjoin-chat");
const removeUserTx = require("@transaction/chat/remove-user-from-group");
const deleteGroupTx = require("@transaction/chat/delete-group");
const createGroupTx = require("@transaction/chat/create-group");
const messageService = require("./message.service");
const Participants = require("@models/participants");
const participantService = require("@services/participants.service");
const env = require("@helpers/env");
const PolicyService = require("./policy.service");
const evnetBus = require("@services/event-bus");
const {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForBiddenException,
} = require("@helpers/errors");
const eventBus = require("@services/event-bus");

class ChatService {
  async searchChat(userId, text) {
    const searchStr = text;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const regexp = new RegExp(searchStr, "i");

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
        $project: {
          groupName: 1,
          type: 1,
          participants: 1,
          users: { username: 1 },
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
    const match = { user: new mongoose.Types.ObjectId(userId) };

    if (cursor) {
      const [lastActivityAt, lastId] = cursor.split("_");
      match["chat.lastActivityAt"] = { $lt: new Date(lastActivityAt) };
      match["chat._id"] = { $lt: new mongoose.Types.ObjectId(lastId) };
    }

    const results = await Participants.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },

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

      { $replaceRoot: { newRoot: "$chat" } },
    ]);

    const nextCursor =
      results.length > 0
        ? `${results[results.length - 1].lastActivityAt.getTime()}_${
            results[results.length - 1]._id
          }`
        : null;

    return { chats: results, nextCursor };
  }
  async find(userId, chatId) {
    await PolicyService.canAccessChat(userId, chatId);
    return Chat.findById(chatId).populate({
      path: "pinned",
      populate: {
        path: "sender",
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
    return await Chat.findByIdAndUpdate(
      chatId,
      [
        {
          $set: {
            pinned: {
              $cond: [
                { $in: [msg, "$pinned"] },
                {
                  $filter: {
                    input: "$pinned",
                    cond: { $ne: ["$$this", msg] },
                  },
                },
                { $concatArrays: ["$pinned", [msg]] },
              ],
            },
          },
        },
      ],
      { new: true },
    ).populate({
      path: "pinned",
      populate: {
        path: "sender",
        select: "_id username avatar bio",
      },
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
      const chat = await Chat.create({
        type: "dm",
        chatKey,
      });

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

    if (data.groupAvatar) {
      update.groupAvatar = data.groupAvatar;
    }
    const participants = uniqueIds.map((id) => {
      if (id == myId) {
        return { user: id, role: "admin" };
      }
      return { user: id };
    });
    const { chat } = await createGroupTx(participants, update);
  }

  async deleteGroup(userId, chatId) {
    const usersNotifs = await PolicyService.canRemoveGroup(userId, chatId);
    await deleteGroupTx(chatId);
    return true;
  }
  async removeUserFromGruop(removerParticipantId, chatId, participantId) {
    if (removerParticipantId.toString() == participantId.toString()) {
      throw new ConflictException("cannot remove yourself");
    }
    const { removedNotif, notifs, removedUser } =
      await PolicyService.canRemoveMember(
        removerParticipantId,
        chatId,
        participantId,
      );

    await removeUserTx(participantId);

    if (removedNotif) {
      eventBus.emitEvent("member.removed", {
        user: removedNotif,
        entity: userId,
        entityModel: "User",
      });
    }
    notifs.forEach((n) => {
      eventBus("member.removed.notice", {
        user: n,
        entity: removedUser,
        entityModel: "User",
      });
    });
  }
  async disjoinChat(participantId, chatId) {
    const { participantsWithSettings, user } =
      await PolicyService.canDisjoinChat(participantId, chatId);

    await disjoinChatTx(participantId, chatId);

    participantsWithSettings.forEach((p) => {
      eventBus.emitEvent("disjoin.chat", { user: p.user, entity: user });
    });
    return true;
  }
  async updateGroup(userId, chatId, data) {
    await PolicyService.canAccessChat(userId, chatId);
    const update = {};
    if (data.groupAvatar) {
      update.groupAvatar = data.groupAvatar;
    }
    if (data.groupName) {
      update.groupName = data.groupName;
    }

    return Chat.findByIdAndUpdate(chatId, update).populate({
      path: "pinned",
      populate: {
        path: "sender",
        select: "_id username avatar bio",
      },
    });
  }
}

module.exports = new ChatService();
