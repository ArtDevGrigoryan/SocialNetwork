const { sendSuccess } = require("@helpers/api-response");
const settingService = require("@services/setting.service");

class SettingController {
  async profileVisibilty(req, res) {
    const data = await settingService.profileVisibility(req.user._id);
    return sendSuccess(res, data);
  }
  async showTyping(req, res) {
    const data = await settingService.showTyping(req.user._id);
    return sendSuccess(res, data);
  }
  async notification(req, res) {
    const data = await settingService.notification(req.user._id, req.body.type);
    return sendSuccess(res, data);
  }
}

module.exports = new SettingController();
