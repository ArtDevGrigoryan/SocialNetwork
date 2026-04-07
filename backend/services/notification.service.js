const { BadRequestException } = require("@helpers/errors");
const {
  SocketBadRequestException,
  SocketConflictException,
  SocketNotFoundException,
} = require("@helpers/socket-errors");
const { settingToEvent } = require("@helpers/utilities/settings-to-event");
const Notification = require("@models/notification");
const Settings = require("@models/setting");
const eventBus = require("@services/event-bus");

class NotificationService {
  async notificationsToMe(id) {
    const settings = await Settings.findOne({ user: id });
    if (!settings) {
      throw new SocketNotFoundException(null, "Something went wrong");
    }
    const types = [];
    for (const [key, value] of Object.entries(settings.notifications)) {
      if (value) {
        const type = settingToEvent(key);
        type ? types.push(type) : null;
      }
    }
    const notifications = await Notification.find({
      user: id,
      isRead: false,
      isSended: false,
      type: { $in: types },
    });

    await Notification.updateMany(
      { _id: { $in: notifications.map((n) => n._id) } },
      { $set: { isSended: true } },
    );
    return notifications;
    
  }
  findById(_id) {
    if (!_id) {
      throw new SocketBadRequestException("Missing notification id");
    }
    return Notification.findOneAndUpdate(
      { _id },
      { isSended: true },
      { new: true },
    );
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
  async find(notifs) {
    const userIds = [...new Set(notifs.map((n) => n.user.toString()))];

    const settingsDocs = await Settings.find({ user: { $in: userIds } });

    const settingsMap = new Map(
      settingsDocs.map((s) => [s.user.toString(), s]),
    );

    const filteredNotifs = notifs.filter((notif) => {
      const userSettings = settingsMap.get(notif.user.toString());
      if (!userSettings) return false;

      const key = eventToSetting(notif.type);
      return key && userSettings.notifications[key];
    });

    return filteredNotifs;
  }
  findMyNotifications(user, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return Notification.find({ user, isRead: false })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
  }
  async create(notifData, settingProp) {
    const setting = await Settings.findOne({ user: notifData.user });
    if (!setting) {
      throw new BadRequestException("Something went wrong");
    }
    if (!setting.notifications[settingProp]) {
      return null;
    }
    return await Notification.create(notifData);
  }
  async markSended(_id) {
    await Notification.updateOne({ _id }, { isSended: true });
  }
}

module.exports = new NotificationService();
