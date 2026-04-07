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
    await Promise.all([
      cache.set(cacheKey, socket.user),
      userService.updateStatus(id, "ONLINE"),
    ]);
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
  
  async joinRoom(socket, data) {
    const { chatId } = data;
    const chat = await chatService.find(chatId, socket.user._id);
    const cacheKey = `chat:${chat._id}`;
    await cache.joinRoom(cacheKey, socket.user._id);
    socket.emit("joined", chat);
  }
  async disjoinRoom(socket, data) {
    const { chatId } = data;
    const cacheKey = `chat:${chatId}`;
    await cache.removeRoom(cacheKey, socket.user._id);
    socket.emit("ok", "helar brat jan");
  }
  async directMessage(socket, data) {
    const { message, chatId } = data;
    const { notifications, message: msg } = await chatService.addMessage(
      socket.user._id,
      chatId,
      message,
    );
    if (notifications.length) {
      const cacheKey = `chat:${chatId}`;
      const members = await cache.getAllMembers(cacheKey);
      const inChats = new Set(members);
      await this.notifyAll(notifications.filter((n) => !inChats.has(n.user)));
    }
    socket.emit("ok", msg);
  }
  async createChatDM(socket, data) {
    const { userId } = data;
    const chat = await chatService.createDM(socket.user._id, userId);
    socket.emit("ok", chat);
  }
  async createChatGroup(socket, data) {
    const { userIds, groupName } = data;
    const chat = await chatService.createGroup(
      socket.user._id,
      userIds,
      groupName,
    );
    return chat;
  }
  async deleteChatDM(socket, data) {
    const { chatId } = data;
    await chatService.removeDM(socket.user._id, chatId);
    socket.emit("ok", "Chat deleted");
  }
  async deleteChatGroup(socket, data) {
    const { chatId } = data;
    await chatService.deleteForUser(socket.user._id, chatId);
  }
  async closeChatGroup(socket, data) {
    const { chatId } = data;
    await chatService.deleteGroup(socket.user._id, chatId);
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
  async getNotifications(socket, data) {
    console.log(data);
    const { page, limit } = data;
    const notifs = await notificationService.findMyNotifications(
      socket.user._id,
      page,
      limit,
    );
    socket.emit("ok", notifs);
  }
  async notify(notificationId) {
    const io = await this.getIO();
    const notification = await notificationService.findById(notificationId);
    const roomKey = `socket:${notification.user._id}`;
    io.to(roomKey).emit("notification", notification);
  }
  async notifyAll(notifications) {
    const [io, onlines] = await Promise.all([
      this.getIO(),
      notifications.map((n) => cache.get(`socket:${n.user.toString()}`)),
    ]);
    const set = new Set(onlines.map((online) => online._id));
    const notifs = await notificationService.find(
      notifications.filter((n) => set.has(n.user.toString())),
    );
    notifs.forEach((n) => {
      if (set.has(n.user.toString())) {
      }

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
