const { cache } = require("@helpers/db/redis");
const { createSocketCacheKey } = require("@helpers/utilities/create-cache-key");
const chatService = require("@services/chat.service");

class SocketEvent {
  async connection(socket) {
    const cacheKey = createSocketCacheKey(socket.id);
    cache.set(cacheKey, socket.user);
    return { connected: true };
  }
  async disconnect(socket) {
    const cacheKey = createSocketCacheKey(socket.id);
    await cache.del(cacheKey);
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
    await accountService.toggleFollow(socket.user._id, userId);
  }
}

module.exports = new SocketEvent();
