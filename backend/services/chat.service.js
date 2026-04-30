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
const socketService = require("@services/socket.service");
const AggregationHelperChat = require("@models/aggregations/chat");
const AggregationHelperParticipant = require("@models/aggregations/participant");
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
    return await AggregationHelperChat.searchChat(userId, text);
  }

  async getChats(userId, { limit = 20, cursor }) {
    const results = await AggregationHelperParticipant.getChats(
      userId,
      limit,
      cursor,
    );

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

  async togglePinMsg(participantId, chatId, msgId) {
    const isMember = await PolicyService.isMember(participantId, chatId);
    if (!isMember) {
      throw new ForBiddenException("User is not a member of this chat");
    }

    const message = await PolicyService.isChatMessage(msgId, chatId);
    if (!message) {
      throw new NotFoundException("Message not found");
    }

    const chat = await Chat.findById(chatId).select("pinned");
    if (!chat) {
      throw new NotFoundException("Chat not found");
    }

    const msgObjectId = new mongoose.Types.ObjectId(msgId);

    const isPinned = chat.pinned?.some(
      (pId) => pId.toString() === msgObjectId.toString(),
    );

    const updateQuery = isPinned
      ? { $pull: { pinned: msgObjectId } }
      : { $addToSet: { pinned: msgObjectId } };

    await Chat.findByIdAndUpdate(chatId, updateQuery);

    const updated = await Chat.findById(chatId)
      .populate({
        path: "pinned",
        model: "Message",
        populate: {
          path: "sender",
          model: "User",
          select: "_id username avatar bio",
        },
      })
      .populate({
        path: "participants",
        populate: {
          path: "user",
          model: "User",
          select: "_id username avatar bio",
        },
      });

    await socketService.emitUpdateChat(chatId, updated);
    return updated;
  }

  async read(userId, chatId) {
    const data = await readMessagesTx(userId, chatId);
    await socketService.emitChatRead(chatId.toString(), userId.toString());
    return data;
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
      const populatedChat = await this.find(myId, chat._id);
      await socketService.emitNewChat([myId, targetId], populatedChat);

      return populatedChat;
    } catch (err) {
      if (err.code === 11000) {
        const existingChat = await Chat.findOne({ type: "dm", chatKey });
        return await this.find(myId, existingChat._id);
      }
      throw err;
    }
  }

  async createGroup(myId, data) {
    myId = myId.toString();
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

    const populatedChat = await this.find(myId, chat._id);
    await socketService.emitNewChat(uniqueIds, populatedChat);
    await notificationService.newGroupNotification({
      chatId: chat._id,
      fromUser: myId,
    });
    return populatedChat;
  }

  async deleteGroup(userId, chatId) {
    await PolicyService.canRemoveGroup(userId, chatId);
    await socketService.emitDeleteChat(chatId);
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
    if (data.theme) update.theme = data.theme;

    const updated = await Chat.findByIdAndUpdate(chatId, update, { new: true })
      .populate({
        path: "pinned",
        populate: { path: "sender", select: "_id username avatar bio" },
      })
      .populate({
        path: "participants",
        populate: { path: "user", select: "_id username avatar bio" },
      });

    await socketService.emitUpdateChat(chatId, updated);

    return updated;
  }

  async addMembers(adderId, chatId, userIds) {
    await PolicyService.canAccessChat(adderId, chatId);

    const chat = await Chat.findById(chatId);
    if (!chat || chat.type !== "group") {
      throw new BadRequestException(
        "This action is only allowed in group chats",
      );
    }

    const existings = await PolicyService.existUsers(userIds);
    const currentParticipants = await Participants.find({ chatId });
    const currentParticipantUserIds = currentParticipants.map((p) =>
      p.user.toString(),
    );

    const newUsers = existings.filter(
      (user) => !currentParticipantUserIds.includes(user._id.toString()),
    );

    if (newUsers.length === 0) {
      throw new BadRequestException("Selected users are already in the group");
    }

    const newParticipants = newUsers.map((u) => ({
      chatId,
      user: u._id,
      role: "member",
    }));

    const inserted = await Participants.insertMany(newParticipants);

    await Participants.populate(inserted, {
      path: "user",
      select: "_id username avatar bio",
    });

    return inserted;
  }

  async updateParticipant(userId, chatId, targetParticipantId, data) {
    const chat = await Chat.findById(chatId);
    if (!chat) throw new NotFoundException("Chat not found");

    const myParticipant = await Participants.findOne({ chatId, user: userId });
    if (!myParticipant)
      throw new ForBiddenException("Not a member of this chat");

    const targetParticipant = await Participants.findById(targetParticipantId);
    if (
      !targetParticipant ||
      targetParticipant.chatId.toString() !== chatId.toString()
    ) {
      throw new NotFoundException("Participant not found in this chat");
    }

    const isAdmin = myParticipant.role === "admin";
    const update = {};

    if (data.participantName !== undefined) {
      update.participantName =
        data.participantName === "" ? null : data.participantName;
    }

    if (data.isMuted !== undefined) {
      if (myParticipant._id.toString() !== targetParticipantId.toString()) {
        throw new ForBiddenException("Դուք կարող եք Mute անել միայն Ձեր համար");
      }
      update.isMuted = data.isMuted;
    }

    if (data.role) {
      if (!isAdmin)
        throw new ForBiddenException("Only admins can change roles");
      update.role = data.role;
    }

    const updated = await Participants.findByIdAndUpdate(
      targetParticipantId,
      update,
      { new: true },
    ).populate("user", "_id username avatar bio");

    return updated;
  }
  async getByKey(key) {
    if (!key) throw new BadRequestException("Key is required");
    const [user1, user2] = key.split(":");
    const blocked = await PolicyService.isBlocked(user1, user2);
    const chat = await Chat.findOne({ chatKey: key });
    if (!chat || blocked) throw new NotFoundException("Chat not found");
    const participants = await Participants.find({ chatId: chat._id }).populate(
      "user",
      "_id username avatar bio",
    );
    chat.participants = participants;
    return chat;
  }
  myChats(userId) {
    return AggregationHelperChat.myChats(userId);
  }
}

module.exports = new ChatService();
