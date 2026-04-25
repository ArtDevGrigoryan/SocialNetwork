const eventsHandlers = require("./events/");

class SocketController {
  async getIO() {
    return require("./socket").getIO();
  }
  async registerEvents() {
    const io = await this.getIO();
    const { connection, ...others } = eventsHandlers;
    io.on("connection", async (socket) => {
      await connection(socket);
      for (const [event, handler] of Object.entries(others)) {
        socket.on(event, handler.bind(null, socket));
      }
    });
  }
}

module.exports = new SocketController();
