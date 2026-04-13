const redis = require("@helpers/db/redis");
const notificationService = require("@services/notification.service");

class SocketService {
  static async getIO() {
    return require("../socket/socket").getIO();
  }
  async notify(notif) {
    const key = `socket:${notif.toUser}`;
    const [io, isOnline] = await Promise.all([
      SocketService.getIO(),
      redis.get(key),
    ]);
    if (isOnline) {
      io.to(key).emit("notification", notif);
      await notificationService.markSended(notif);
    }
  }
  async notifyMany(notifs) {
    const io = await SocketService.getIO();
    const sended = [];
    for (const notif of notifs) {
      const key = `socket:${notif.toUser}`;
      const isOnline = !!(await redis.get("key"));
      if (isOnline) {
        io.to(key).emit("notification", notif);
        sended.push(notif._id);
      }
    }
    await notificationService.markSendedMany(sended);
  }
}

module.exports = new SocketService();
