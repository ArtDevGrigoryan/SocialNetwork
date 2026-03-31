const {
  SocketBadRequestException,
  SocketConflictException,
  SocketNotFoundException,
} = require("@helpers/socket-errors");
const Notification = require("@models/notification");

class NotificationService {
  notificationsToMe(id) {
    return Notification.find({ user: id, isRead: false, isSended: false });
  }
  findById(id) {
    if (!id) {
      throw new SocketBadRequestException("Missing notification id");
    }
    return Notification.findById(id);
  }
  async markRead(userId, id) {
    const notification = await Notification.findById(id);
    if (!notification) {
      throw new SocketNotFoundException(null, "Notification not found");
    }
    if (notification.user != userId.toString()) {
      throw new SocketConflictException(
        null,
        "Cannot access this notification",
      );
    }
    if (notification.isRead) {
      throw new SocketBadRequestException(null, "Already read");
    }
    notification.isRead = true;
    await notification.save();
  }
  delete(userId, id) {
    return Notification.deleteOne({ _id: id, user: userId });
  }
  deleteAll(userId) {
    return Notification.deleteMany({ user: userId });
  }
  async find(notificationIds) {
    return await Promise.all(
      notificationIds.map((id) => Notification.findById(id)),
    );
  }
}

module.exports = new NotificationService();
