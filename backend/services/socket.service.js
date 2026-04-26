const redis = require("@helpers/db/redis");
const notificationService = require("@services/notification.service");
const { Emitter } = require("@socket.io/redis-emitter");

const ioEmitter = new Emitter(redis);

class SocketService {
  async notify(notif) {
    const key = `socket:${notif.toUser}`;

    const isOnline = await redis.get(key);

    if (isOnline) {
      ioEmitter.to(key).emit("receive_notification", notif);
      await notificationService.markSended(notif);
    }
  }

  async notifyMany(notifs) {
    const sended = [];
    for (const notif of notifs) {
      const key = `socket:${notif.toUser}`;
      const isOnline = !!(await redis.get(key));
      if (isOnline) {
        ioEmitter.to(key).emit("receive_notification", notif);
        sended.push(notif._id);
      }
    }
    await notificationService.markSendedMany(sended);
  }

  async emitStoryUpdate(userId, updateData) {
    const key = `socket:${userId}`;
    ioEmitter.to(key).emit("story_update", updateData);
  }

  async emitRequestActionSync(userId, syncData) {
    const key = `socket:${userId}`;
    ioEmitter.to(key).emit("request_action_sync", syncData);
  }

  async emitReceiveMessage(chatId, message) {
    ioEmitter.to(`chat:${chatId}`).emit("receive_message", message);
  }

  async emitReaction(chatId, messageId, reactionData) {
    ioEmitter.to(`chat:${chatId}`).emit("message:reaction", {
      messageId,
      reaction: reactionData,
    });
  }

  async emitRemoveReaction(chatId, messageId, participantId) {
    ioEmitter.to(`chat:${chatId}`).emit("message:remove_reaction", {
      messageId,
      participantId,
    });
  }

  async emitDeleteMessage(chatId, messageId) {
    ioEmitter.to(`chat:${chatId}`).emit("message:deleted", {
      messageId,
    });
  }

  async emitEditMessage(chatId, messageId, text, media) {
    ioEmitter.to(`chat:${chatId}`).emit("message:edited", {
      messageId,
      text,
      media,
    });
  }

  async emitNewChat(userIds, chatObj) {
    for (const userId of userIds) {
      ioEmitter.to(`socket:${userId.toString()}`).emit("chat:new", chatObj);
    }
  }

  async emitDeleteChat(chatId) {
    ioEmitter.to(`chat:${chatId}`).emit("chat:deleted", { chatId });
  }

  async emitUpdateChat(chatId, chatObj) {
    ioEmitter.to(`chat:${chatId}`).emit("chat:updated", chatObj);
  }

  async emitChatRead(chatId, userId) {
    ioEmitter.to(`chat:${chatId}`).emit("chat:read", {
      chatId,
      userId,
    });
  }
}

module.exports = new SocketService();
