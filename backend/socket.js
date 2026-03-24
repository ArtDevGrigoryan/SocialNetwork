const { Server } = require("socket.io");
const cors = require("@constants/cors-origin");

let io = null;

module.exports.initSocket = (server) => {
  io = new Server(server, {
    cors,
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
