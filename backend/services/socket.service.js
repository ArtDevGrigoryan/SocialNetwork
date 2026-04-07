const { cache } = require("@helpers/db/redis");
const notificationService = require("./notification.service");

class SocketService {
  static async getIO() {
    return require("../socket/socket").getIO();
  }
  async notify(notif) {
    const key = `socket:${notif.user}`;
    const [io, isOnline] = await Promise.all([
      SocketService.getIO(),
      cache.get(key),
    ]);
    if (isOnline) {
      io.to(key).emit("notification", notif);
      await notificationService.markSended(notif._id);
    }
  }
}

module.exports = new SocketService();
