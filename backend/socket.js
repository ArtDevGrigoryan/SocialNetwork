const { Server } = require("socket.io");

let io = null;

module.exports.initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "http://localhost:5173", credentials: true },
    transports: ["websocket"],
  });
  return io;
};

module.exports.getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
