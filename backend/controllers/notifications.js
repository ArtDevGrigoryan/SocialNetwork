const { sendSuccess } = require("@helpers/api-response");
const notificationsService = require("@services/notifications-rest.service");
const notificationService = require("@services/notification.service");

class NotificationsController {
  async list(req, res) {
    const { page, limit } = req.validated.query;
    const data = await notificationsService.list(req.user._id, { page, limit });
    return sendSuccess(res, data);
  }

  async unread(req, res) {
    const data = await notificationsService.unreadCount(req.user._id);
    return sendSuccess(res, data);
  }

  async markRead(req, res) {
    await notificationService.markRead(req.user._id, req.params.id);
    return sendSuccess(res, true);
  }

  async markAllRead(req, res) {
    await notificationsService.markAllRead(req.user._id);
    return sendSuccess(res, true);
  }
}

module.exports = new NotificationsController();
