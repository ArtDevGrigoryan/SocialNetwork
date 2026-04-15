const Notification = require("@models/notification");

class NotificationsService {
  async list(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    return Notification.find({ toUser: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("fromUser", "_id username avatar bio")
      .populate("meta.users", "_id username avatar bio")
      .populate("entity");
  }

  async unreadCount(userId) {
    const count = await Notification.countDocuments({ toUser: userId, isRead: false });
    return { count };
  }

  async markAllRead(userId) {
    await Notification.updateMany({ toUser: userId, isRead: false }, { isRead: true });
    return true;
  }
}

module.exports = new NotificationsService();
