const { cache } = require("@db/redis");
const validate = require("@helpers/validate");
const { joinRoomSchema } = require("@schemas/cache.schema");
const chatService = require("@services/chat.service");
const { SocketNotFoundException } = require("@helpers/socket-errors/");

class SocketHandlerService {
  constructor() {
    this.eventsHandlers = {
      connection: this.connection.bind(this),
      disconnect: this.handleDisconnect.bind(this),
      join_room: validate(joinRoomSchema, this.joinRoom.bind(this)),
    };
  }
  getIO() {
    return require("../socket").getIO();
  }
  registerEventHandlers() {
    const io = this.getIO();
    io.on("connection", this.connection.bind(this));
  }
  async connection(socket) {
    const cacheKey = `socket:${socket.id}`;
    await cache.set(cacheKey, "connected");

    for (const [event, handler] of Object.entries(this.eventsHandlers)) {
      socket.on(event, async (data, cb) => {
        try {
          return await handler.call(this, socket, data, cb);
        } catch (err) {
          return socket.emit(err.event ?? "error", { message: err.message });
        }
      });
    }
  }
  async handleDisconnect(socket) {
    const cacheKey = `socket:${socket.id}`;
    await cache.del(cacheKey);
  }

  async joinRoom(socket, data) {
    const cacheKey = `room:${data.id}`;
    const chat = await chatService.find(data.id);

    if (!chat) {
      throw new SocketNotFoundException();
    }
    socket.join(data.id);

    await cache.joinRoom(cacheKey, data);
    return { joined: true };
  }
}

module.exports = new SocketHandlerService();
