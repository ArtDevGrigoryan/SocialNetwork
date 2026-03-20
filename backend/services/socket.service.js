class SocketService {
  getIO() {
    return require("../socket").getIO();
  }
}

module.exports = new SocketService();
