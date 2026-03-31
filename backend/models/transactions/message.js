const mongoose = require("mongoose");
const Chat = require("@models/chat");
const Message = require("@models/message");
const Notification = require("@models/notification");
const {
  SocketNotFoundException,
  SocketConflictException,
} = require("@helpers/socket-errors");

module.exports = async function sendMessage(userId, chatId, data) {
  const session = await mongoose.startSession();

  try {
    const result = { notifications: null, message: null };
    return await session.withTransaction(async () => {
      const chat = await Chat.findById(chatId, null, { session });

      if (!chat) {
        throw new SocketNotFoundException(null, "Chat not found");
      }

      const isMember = chat.participants.some(
        (p) => p.user.toString() === userId.toString(),
      );

      if (!isMember) {
        throw new SocketConflictException("Not a member of chat");
      }

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

      let receivers = [];

      for (const p of chat.participants) {
        if (p.user.toString() !== userId.toString()) {
          p.unreadCount += 1;
          receivers.push(p.user);
        }
      }

      chat.lastMessage = message._id;
      chat.lastActivityAt = new Date();

      await chat.save({ session });

      if (receivers.length) {
        const notifications = await Notification.insertMany(
          receivers.map((user) => ({
            user,
            type: "MESSAGE",
            entity: message._id,
            entityModel: "Message",
          })),
          { session },
        );
        result.notifications = notifications.map((notif) => notif._id);
      }
      result.message = message;
      return result;
    });
  } finally {
    await session.endSession();
  }
};
