const mongoose = require("mongoose");
const Chat = require("@models/chat");
const Message = require("@models/message");
const sendMessageTx = require("@transaction/chat/message");
const readMessagesTx = require("@transaction/chat/read-messages");
const disjoinChatTx = require("@transaction/chat/disjoin-chat");
const removeUserTx = require("@transaction/chat/remove-user-from-group");
const deleteGroupTx = require("@transaction/chat/delete-group");
const {
  SocketNotFoundException,
  SocketConflictException,
  SocketBadRequestException,
} = require("@helpers/socket-errors");
const messageService = require("./message.service");
const Participants = require("@models/participants");
const participantService = require("@services/participants.service");
const env = require("@helpers/env");

class ChatService {
  searchChat(userId, text) {
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
            { groupName: { $regex: searchStr, $options: "i" } },
            { "users.username": { $regex: searchStr, $options: "i" } },
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
    ]);
  }
  async getChats(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const chatIds = await Participants.find({ user: userId }).select("chatId");
    return await Chat.find({ _id: { $in: cahtIds } })
      .sort({ lastActivityAt: -1 })
      .skip(skip)
      .limit(limit);
  }
  async find(chatId, userId) {
    const [chat, participant] = await Promise.all([
      Chat.findById(chatId),
      participantService.findOne(userId, chatId),
    ]);
    if (!chat) throw new SocketNotFoundException(null, "Chat not found");
    if (!participant) {
      throw new SocketConflictException(null, "Cannot access in this chat");
    }
    return chat;
  }
  async togglePinMsg(user, chatId, msg) {
    const [chat, participant, message] = await Promise.all([
      Chat.findById(chatId),
      participantService.findOne(user, chatId),
      Message.findById(msg),
    ]);
    if (!chat || !participant || message) {
      throw new SocketNotFoundException(null, "Error");
    }
    const alreadyPinned = chat.pinned.find((id) => id.toString() == msg);
    if (alreadyPinned) {
      chat.pinned.filter((id) => id.toString() != msg);
      await chat.save();
      return chat;
    }
    if (chat.pinned.length + 1 >= env.PINN_LIMIT) {
      throw new SocketBadRequestException(
        null,
        `Pinned message limit is ${env.PINN_LIMIT}`,
      );
    }
    chat.pinned.push(msg);
    await chat.save();
    return chat;
  }
  addMessage(userId, chatId, text) {
    return sendMessageTx(userId, chatId, { type: "TEXT", text });
  }
  addVoice(userId, chatId, voiceUrl) {
    return sendMessageTx(userId, chatId, { type: "VOICE", voiceUrl });
  }
  async editMessage(userId, messageId, newText) {
    const message = await Message.findById(messageId);
    if (!message) throw new SocketNotFoundException("Message not found");
    if (message.sender.toString() !== userId.toString()) {
      throw new SocketConflictException("Cannot edit someone else's message");
    }
    if (message.type != "TEXT") {
      throw new SocketBadRequestException(
        null,
        "Cannot edit this message but is it not edditable",
      );
    }
    message.text = newText;
    message.editedAt = new Date();
    await message.save();
    return message;
  }
  async deleteMessage(userId, messageId) {
    const message = await Message.findById(messageId);
    if (!message) throw new SocketNotFoundException("Message not found");
    if (message.sender.toString() !== userId.toString()) {
      throw new SocketConflictException("Cannot delete someone else's message");
    }
    await message.deleteOne();
    return true;
  }
  async read(userId, chatId) {
    return readMessagesTx(userId, chatId);
  }
  async createDM(myId, targetId) {
    const chatKey = [myId, targetId].sort().join(":");
    let chat = await Chat.findOne({
      type: "dm",
      chatKey,
    });
    if (!chat) {
      chat = await Chat.create({
        type: "dm",
        participants: [{ user: myId }, { user: targetId }],
        chatKey,
      });
    }
    return chat;
  }
  async createGroup(myId, userIds, groupName) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new SocketBadRequestException(null, "Users required");
    }

    const uniqueIds = [...new Set([myId.toString(), ...userIds.map(String)])];

    if (uniqueIds.length < 2) {
      throw new SocketBadRequestException(null, "At least 2 users required");
    }

    const participants = uniqueIds.map((id) => ({
      user: id,
    }));

    const chat = await Chat.create({
      type: "group",
      participants,
      admins: [myId],
      groupName: groupName || "New Group",
    });
    return chat;
  }
  async getMessages(chatId, userId, cursor, limit) {
    const participant = await participantService.findOne(userId, chatId);

    if (!participant) {
      throw new SocketConflictException(null, "User is not a participant");
    }

    const date = participant.deletedAt;
    return await messageService.getMessages({
      participant,
      userId,
      cursor,
      limit,
    });
  }
  deleteGroup(userId, chatId) {
    return deleteGroupTx(userId, chatId);
  }
  removeUserFromGruop(userId, chatId, participantId) {
    return removeUserTx(userId, chatId, participantId);
  }
  disjoinChat(userId, chatId) {
    return disjoinChatTx(userId, chatId);
  }
  async changeGroup(userId, chatId, data) {
    const participant = await Participants.findOne({ user: userId, chatId });
    if (!participant) {
      throw new SocketConflictException(
        null,
        "User is not a member in this chat",
      );
    }
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new SocketNotFoundException(null, "Chat not found");
    }
    const { groupName, groupAvatar } = data;
    if (groupName) {
      chat.groupName = groupName;
    }
    if (groupAvatar) {
      chat.groupAvatar = groupAvatar;
    }
    await chat.save();
    return chat;
  }
}

module.exports = new ChatService();
