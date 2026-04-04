const Notification = require("@models/notification");

module.exports = async function settingsNotifications(data, session) {
  const { settings, propName, entity, entityModel, type } = data;
  if (Array.isArray(settings)) {
    const includes = [];
    const missing = [];
    for (let i = 0; i < settings.length; ++i) {
      const { notifications } = settings[i];
      if (notifications[propName]) {
        includes.push(settings[i].user.toString());
      } else {
        missing.push(settings[i].user.toString());
      }
    }
    let notifs = [];
    if (includes.length) {
      notifs = await Notification.insertMany(
        includes.map((user) => ({
          user,
          type,
          entity,
          entityModel,
        })),
        { session },
      );
    }
    if (missing.length) {
      await Notification.insertMany(
        missing.map((user) => ({
          user,
          type: settingToEvent(propName),
          entitiy,
          entityModel,
          isSended: true,
        })),
        { session },
      );
    }
    return notifs;
  }
  const { notifications } = settings;
  const isSended = !notifications[propName];
  const notif = await Notification.create(
    [
      {
        user: settings.user,
        type,
        entitiy,
        entityModel,
        isSended,
      },
    ],
    { session },
  );
  return !isSended ? notif : [];
};
