const mongoose = require("mongoose");
const Chat = require("@models/chat");
const Message = require("@models/message");

const {
  SocketNotFoundException,
  SocketConflictException,
} = require("@helpers/socket-errors");
const Participants = require("@models/participants");

module.exports = async function sendMessage(userId, chatId, data) {
  const session = await mongoose.startSession();

  try {
    const result = { message: null };
    await session.withTransaction(async () => {
      const [message] = await Message.create(
        [
          {
            chat: chatId,
            sender: userId,
            ...data,
          },
        ],
        { session },
      );
      await Promise.all([
        Participants.updateMany(
          { user: { $ne: userId }, chatId, isMuted: false },
          { $inc: { unreadCount: 1 } },
        ).session(session),
        Chat.updateOne(
          { _id: chatId },
          { lastMessage: message._id, lastActivityAt: new Date() },
        ).session(session),
      ]);

      result.message = message;
    });
    return result;
  } finally {
    await session.endSession();
  }
};
