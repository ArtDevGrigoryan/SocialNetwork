const redis = require("@helpers/db/redis");
const notificationService = require("@services/notification.service");

class SocketService {
  static async getIO() {
    return require("../socket/socket").getIO();
  }

  async notify(notif) {
    const key = `socket:${notif.toUser}`;
    const [io, isOnline] = await Promise.all([
      SocketService.getIO(),
      redis.get(key),
    ]);
    if (isOnline) {
      io.to(key).emit("notification", notif);
      await notificationService.markSended(notif);
    }
  }

  async emitReceiveMessage(chatId, message) {
    const io = await SocketService.getIO();
    io.to(`chat:${chatId}`).emit("receive_message", message);
  }

  async notifyMany(notifs) {
    const io = await SocketService.getIO();
    const sended = [];
    for (const notif of notifs) {
      const key = `socket:${notif.toUser}`;
      const isOnline = !!(await redis.get(key));
      if (isOnline) {
        io.to(key).emit("notification", notif);
        sended.push(notif._id);
      }
    }
    await notificationService.markSendedMany(sended);
  }

  async emitReaction(chatId, messageId, reactionData) {
    const io = await SocketService.getIO();
    io.to(`chat:${chatId}`).emit("message:reaction", {
      messageId,
      reaction: reactionData,
    });
  }

  async emitRemoveReaction(chatId, messageId, participantId) {
    const io = await SocketService.getIO();
    io.to(`chat:${chatId}`).emit("message:remove_reaction", {
      messageId,
      participantId,
    });
  }

  async emitDeleteMessage(chatId, messageId) {
    const io = await SocketService.getIO();
    io.to(`chat:${chatId}`).emit("message:deleted", {
      messageId,
    });
  }

  async emitEditMessage(chatId, messageId, text, media) {
    const io = await SocketService.getIO();
    io.to(`chat:${chatId}`).emit("message:edited", {
      messageId,
      text,
      media,
    });
  }

  async emitNewChat(userIds, chatObj) {
    const io = await SocketService.getIO();
    for (const userId of userIds) {
      io.to(`socket:${userId.toString()}`).emit("chat:new", chatObj);
    }
  }

  async emitDeleteChat(chatId) {
    const io = await SocketService.getIO();
    io.to(`chat:${chatId}`).emit("chat:deleted", { chatId });
  }

  async emitUpdateChat(chatId, chatObj) {
    const io = await SocketService.getIO();
    io.to(`chat:${chatId}`).emit("chat:updated", chatObj);
  }

  async emitChatRead(chatId, userId) {
    const io = await SocketService.getIO();
    io.to(`chat:${chatId}`).emit("chat:read", {
      chatId,
      userId,
    });
  }
}

module.exports = new SocketService();
