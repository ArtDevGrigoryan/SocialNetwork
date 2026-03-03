const { disconnect } = require("../db/connect");

module.exports = async function shutDown(server, socket) {
  await disconnect();
  server.close(() => {
    console.dir("Server closed. Exiting process.", { colors: true });
  });
  if (socket) {
    socket.close(() => {
      console.dir("Socket closed.", { colors: true });
    });
  }
};
