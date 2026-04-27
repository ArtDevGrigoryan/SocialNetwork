const Notification = require("@models/notification");
const Post = require("@models/post");
const Story = require("@models/story");
const User = require("@models/user");
const Comment = require("@models/comment");
const Message = require("@models/message");
const Chat = require("@models/chat");
const { NotFoundException } = require("@helpers/errors");

class NotificationsService {
  list(userId, { page = 1, limit = 20 } = {}) {
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
    const count = await Notification.countDocuments({
      toUser: userId,
      isRead: false,
    });
    return { count };
  }

  async markAllRead(userId) {
    await Notification.updateMany(
      { toUser: userId, isRead: false },
      { isRead: true },
    );
    return true;
  }
  async markRead(userId, notifId) {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notifId,
        toUser: userId,
      },
      { isRead: true },
    );
    if (!notification) {
      throw new NotFoundException("Notification not found");
    }
    return true;
  }
  async deleteOne(userId, notifId) {
    const deleted = await Notification.findOneAndDelete({
      _id: notifId,
      toUser: userId,
    });

    if (!deleted) {
      throw new NotFoundException("Notification not found");
    }
    return true;
  }
  async deleteAll(userId) {
    await Notification.deleteMany({ toUser: userId });
    return true;
  }
}

module.exports = new NotificationsService();
