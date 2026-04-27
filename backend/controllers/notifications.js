const { sendSuccess } = require("@helpers/api-response");
const notificationRestService = require("@services/notifications-rest.service");

class NotificationsController {
  async list(req, res) {
    const { page, limit } = req.validated.query;
    const data = await notificationRestService.list(req.user._id, {
      page,
      limit,
    });
    return sendSuccess(res, data);
  }

  async unread(req, res) {
    const data = await notificationRestService.unreadCount(req.user._id);
    return sendSuccess(res, data);
  }

  async markRead(req, res) {
    await notificationRestService.markRead(req.user._id, req.params.id);
    return sendSuccess(res, true);
  }

  async markAllRead(req, res) {
    await notificationRestService.markAllRead(req.user._id);
    return sendSuccess(res);
  }
  async deleteOne(req, res) {
    await notificationRestService.deleteOne(req.user._id, req.params.id);
    return sendSuccess(res);
  }
  async deleteAll(req, res) {
    await notificationRestService.deleteAll(req.user._id);
    return sendSuccess(res);
  }
}

module.exports = new NotificationsController();
