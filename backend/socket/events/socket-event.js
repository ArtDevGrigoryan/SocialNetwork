const redis = require("@helpers/db/redis");
const { createSocketCacheKey } = require("@helpers/utilities/create-cache-key");
const PolicyService = require("@services/policy.service");
const userService = require("@services/user.service");

class SocketEvent {
  static async getIO() {
    const { getIO } = require("../socket");
    return getIO();
  }
  async connection(socket) {
    const id = socket.user._id;
    socket.join(`socket:${id}`);
    const cacheKey = createSocketCacheKey(id);
    await Promise.all([
      redis.set(cacheKey, socket.user),
      userService.updateStatus(id, "ONLINE"),
    ]);
  }
  async disconnect(socket) {
    const id = socket.user._id;
    const cacheKey = createSocketCacheKey(id);
    await redis.del(cacheKey);
    await userService.updateStatus(id);
  }
  async join_chat(socket, data) {
    const { chatId } = data;
    const { user } = socket;
    await PolicyService.canAccessChat(user._id, chatId);
    socket.join(`chat:${chatId}`);
  }
  async join_post(socket, data) {
    const { postId } = data;
    if (!postId) return;
    socket.join(`post:${postId}`);
  }
  async leave_post(socket, data) {
    const { postId } = data;
    if (!postId) return;
    socket.leave(`post:${postId}`);
  }
  async typing(socket, data) {
    const { chatId } = data;
    const { user } = socket;
    await PolicyService.canAccessChat(user._id, chatId);
    const result = {
      bio: user.bio,
      username: user.username,
      avatar: user.avatar,
      _id: user._id,
    };
    const io = await SocketEvent.getIO();
    io.to(`chat:${chatId}`).emit("typing", result);
  }
  async voice(socket, data) {
    const { chatId } = data;
    const { user } = socket;
    await PolicyService.canAccessChat(user._id, chatId);
    const result = {
      bio: user.bio,
      username: user.username,
      avatar: user.avatar,
      _id: user._id,
    };
    const io = await SocketEvent.getIO();
    io.to(`chat:${chatId}`).emit("voice", result);
  }
}

module.exports = new SocketEvent();
