const cache = require("../helpers/db/redis");
const chatService = require("./chat.service");

class SocketHandlerService {
  getIO() {
    return require("../socket").getIO();
  }
  registerEventHandlers() {
    const io = this.getIO();
    io.on("connection", this.connection.bind(this));
  }
  async connection(socket) {
    console.log("User connected:", socket.id);
    cache.set(cacheKey, "connected");

    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id);
      await cache.del(cacheKey);
    });
    socket.on("join_room", async (data) => {
      console.log("joined room");
      const chat = await chatService.find(data.chatId);
      const cacheKey = `room:${chat._id}`;
      const room = await cache.get(cacheKey);
    });
  }
}

module.exports = new SocketHandlerService();
