const mongoose = require("mongoose");
const Chat = require("@models/chat");
const Participant = require("@models/participants");
const { ForBiddenException, NotFoundException } = require("@helpers/errors");
const PolicyService = require("@services/policy.service");

module.exports = async function readMessages(userId, chatId) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const participant = await PolicyService.canAccessChat(
        userId,
        chatId,
        session,
      );

      const chat = await Chat.findById(chatId).session(session);
      if (!chat) throw new NotFoundException("Chat not found");

      await Participant.updateOne(
        { _id: participant._id },
        { unreadCount: 0, lastReadMessage: chat.lastMessage },
      ).session(session);

      return true;
    });
  } finally {
    await session.endSession();
  }
};
