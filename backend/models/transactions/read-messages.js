const mongoose = require("mongoose");
const Chat = require("@models/chat");

module.exports = async function readMessages(userId, chatId) {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const chat = await Chat.findById(chatId, null, { session });

      if (!chat) return;

      const participant = chat.participants.find(
        (p) => p.user.toString() === userId.toString(),
      );

      if (!participant) return;

      participant.unreadCount = 0;
      participant.lastReadMessage = chat.lastMessage;

      await chat.save({ session });

      return true;
    });
  } finally {
    await session.endSession();
  }
};
