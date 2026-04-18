const { NotFoundException } = require("@helpers/errors");
const Setting = require("@models/setting");

class SettingService {
  async getSettings(user) {
    const settings = await Setting.findOne({ user }).lean();
    if (!settings) throw new NotFoundException("Settings not found");
    return settings;
  }
  async profileVisibility(user) {
    const setting = await Setting.findOne({ user });
    if (setting.privacy.profileVisibility == "PRIVATE") {
      setting.privacy.profileVisibility = "PUBLIC";
      await setting.save();
      return "Profile Visibility public";
    }
    setting.privacy.profileVisibility = "PRIVATE";
    await setting.save();
    return "Profile Visibilty private";
  }
  async showTyping(user) {
    const setting = await Setting.findOne({ user });
    setting.privacy.showTyping = !setting.privacy.showTyping;
    await setting.save();
    return { showTyping: setting.privacy.showTyping };
  }
  async notification(user, type) {
    const setting = await Setting.findOne({ user });
    if (!setting) throw new NotFoundException("Settings not found");

    if (!(type in setting.notifications)) {
      throw new NotFoundException("Invalid notification type");
    }

    setting.notifications[type] = !setting.notifications[type];

    await setting.save();

    return {
      [type]: setting.notifications[type],
    };
  }
}

module.exports = new SettingService();
