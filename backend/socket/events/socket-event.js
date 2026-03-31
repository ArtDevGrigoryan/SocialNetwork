const { cache } = require("@helpers/db/redis");
const { createSocketCacheKey } = require("@helpers/utilities/create-cache-key");
const chatService = require("@services/chat.service");
const userService = require("@services/user.service");
const friendService = require("@services/friend.service");
const notificationService = require("@services/notification.service");

class SocketEvent {
  async getIO() {
    const { getIO } = require("../socket");
    return getIO();
  }
  async connection(socket) {
    const id = socket.user._id;
    socket.join(`socket:${id}`);
    const cacheKey = createSocketCacheKey(id);
    const notifications = await notificationService.notificationsToMe(id);
    await cache.set(cacheKey, socket.user);
    await userService.updateStatus(id, "ONLINE");
    if (notifications && notifications.length) {
      notifications.forEach((notify) => {
        socket.emit("notification", notify);
      });
    }
  }
  async disconnect(socket) {
    const id = socket.user._id;
    const cacheKey = createSocketCacheKey(id);
    await cache.del(cacheKey);
    await userService.updateStatus(id);
    console.log("դիզքոնեկտադո");
  }
  async startDM(socket, data) {
    const { userId } = data;
    const chat = await chatService.startDM(socket.user._id, userId);
    socket.emit("ok", chat);
  }
  async directMessage(socket, data) {
    const { message, chatId } = data;
    const { notifications, message: msg } = await chatService.addMessage(
      socket.user._id,
      chatId,
      message,
    );
    if (notifications.length) {
      await this.notifyAll(notifications);
    }
    socket.emit("ok", msg);
  }
  async joinRoom(socket, data) {
    const { chatId } = data;
    const chat = await chatService.find(chatId, socket.user._id);
    const cacheKey = `chat:${chat._id}`;
    await cache.joinRoom(cacheKey, socket.user._id);
    socket.emit("joined", chat);
  }
  async createChat(socket, data) {
    const { userIds } = data;
    const chat = await chatService.create(socket.user._id, ...userIds);
  }
  async follow(socket, data) {
    const { userId } = data;
    const res = await friendService.follow(socket.user._id, userId);
    const targetUserIsOnline = await cache.get(`socket:${userId}`);
    if (targetUserIsOnline) {
      await this.notify(res.notification);
    }
    socket.emit("ok", res.message || "success");
  }
  async unfollow(socket, data) {
    const { userId } = data;
    const res = await friendService.unfollow(socket.user._id, userId);
    const targetUserIsOnline = await cache.get(`socket:${userId}`);
    if (targetUserIsOnline) {
      await this.notify(res.notification);
    }
    socket.emit("ok", res.message || "success");
  }
  async cancelRequest(socket, data) {
    const { userId } = data;
    const res = await friendService.cancel(socket.user._id, userId);
    const targetUserIsOnline = await cache.get(`socket:${userId}`);
    if (targetUserIsOnline) {
      await this.notify(res.notification);
    }
    socket.emit("ok", res.message || "success");
  }
  async acceptRequest(socket, data) {
    const { userId } = data;
    const res = await friendService.accept(socket.user._id, userId);
    const targetUserIsOnline = await cache.get(`socket:${userId}`);
    if (targetUserIsOnline) {
      await this.notify(res.notification);
    }
    socket.emit("ok", res.message || "success");
  }
  async declineRequest(socket, data) {
    const { userId } = data;
    const res = await friendService.decline(socket.user._id, userId);
    const targetUserIsOnline = await cache.get(`socket:${userId}`);
    if (targetUserIsOnline) {
      await this.notify(res.notification);
    }
    socket.emit("ok", res.message || "success");
  }
  async notify(notificationId) {
    const io = await this.getIO();
    const notification = await notificationService.findById(notificationId);
    const roomKey = `socket:${notification.user._id}`;
    io.to(roomKey).emit("notification", notification);
  }
  async notifyAll(notifications) {
    const io = await this.getIO();
    const notifs = await notificationService.find(notifications);
    notifs.forEach((n) => {
      const roomKey = `socket:${n.user._id}`;
      io.to(roomKey).emit("notification", n);
    });
  }
  async markRead(socket, data) {
    const { notificationId } = data;
    await notificationService.markRead(socket.user._id, notificationId);
    socket.emit("notification_readed", null);
  }
  async deleteNotification(socket, data) {
    const { notificationId } = data;
    await notificationService.delete(socket.user._id, notificationId);
    socket.emit("ok", "notification deleted");
  }
  async deleteAllNotifications(socket) {
    await notificationService.deleteAll(socket.user._id);
    socket.emit("ok", "notifications deleted");
  }
  async search(socket, data) {
    const { text } = data;
    const founds = await userService.search(text);
    socket.emit("search:result", founds);
  }
  async searchInFollowers(socket, data) {
    const { text } = data;
    const founds = await userService.searchInFollowers(socket.user._id, text);
    socket.emit("search:followers", founds);
  }
  async searchInFollowings(socket, data) {
    const { text } = data;
    const founds = await userService.searchInFollowings(socket.user._id, text);
  }
}

module.exports = new SocketEvent();
