const mongoose = require("mongoose");
const Chat = require("@models/chat");
const Participants = require("@models/participants");
const { SocketConflictException } = require("@helpers/socket-errors");

module.exports = async function readMessages(userId, chatId) {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const participant = await Participants.findOne({
        user: userId,
        chatId,
      }).session(session);

      if (!participant) {
        throw new SocketConflictException(
          null,
          "User is not a member of this chat",
        );
      }
      participant.unreadCount = 0;
      participant.lastReadMessage = chat.lastMessage;

      await participant.save({ session });
      return true;
    });
  } finally {
    await session.endSession();
  }
};
