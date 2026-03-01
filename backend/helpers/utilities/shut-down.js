module.exports = function shutDown(server, socket) {
  server.close(() => {
    console.dir("Server closed. Exiting process.", { colors: true });
  });
  if (socket) {
    socket.close(() => {
      console.dir("Socket closed.", { colors: true});
    });
  }
};
