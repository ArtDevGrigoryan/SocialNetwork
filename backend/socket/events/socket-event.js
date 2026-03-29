const { cache } = require("@helpers/db/redis");
const { createSocketCacheKey } = require("@helpers/utilities/create-cache-key");
const chatService = require("@services/chat.service");
const userService = require("@services/user.service");
const friendService = require("@services/friend.service");

class SocketEvent {
  async connection(socket) {
    const id = socket.user._id;
    socket.join(id);
    const cacheKey = createSocketCacheKey(id);
    await cache.set(cacheKey, socket.user);
    await userService.updateStatus(id, "ONLINE");
    console.log("քոնեկտադո");
    return { connected: true };
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
    const chat = await chatService.find(chatId);
    const cacheKey = chat._id;
    socket.emit("data", { hello: "WORLD" });
    await cache.joinRoom(cacheKey, data);
  }
  async createChat(socket, data) {
    const { userIds } = data;
    const chat = await chatService.create(socket.user._id, ...userIds);
  }
  async follow(socket, data) {
    const { userId } = data;
    const res = await friendService.follow(socket.user._id, userId);
    socket.emit("ok", res);
  }
  async unfollow(socket, data) {
    const { userId } = data;
    const res = await friendService.unfollow(socket.user._id, userId);
    socket.emit("ok", res);
  }
  async cancelRequest(socket, data) {
    const { userId } = data;
    const res = await friendService.cancel(socket.user._id, userId);
    socket.emit("ok", res);
  }
  async acceptRequest(socket, data) {
    const { userId } = data;
    const res = await friendService.accept(socket.user._id, userId);
    socket.emit("ok", res);
  }
  async declineRequest(socket, data) {
    const { userId } = data;
    const res = await friendService.decline(socket.user._id, userId);
    socket.emit("ok", res);
  }
}

module.exports = new SocketEvent();
