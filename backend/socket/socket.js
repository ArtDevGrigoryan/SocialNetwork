const { Server } = require("socket.io");
const cors = require("@constants/cors-origin");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

let io = null;

module.exports.initSocket = (server) => {
  io = new Server(server, {
    cors,
    transports: ["websocket"],
  });

  const pubClient = createClient({ url: "redis://127.0.0.1:6379" });
  const subClient = pubClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      console.log("✅ Socket.io Redis adapter-ը հաջողությամբ միացավ");
    })
    .catch((err) => {
      console.error("❌ Redis adapter-ին միանալու սխալ:", err);
    });

  return io;
};

module.exports.getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
