const events = {
  LIKE: "like",
  FOLLOW: "follow",
  UNFOLLOW: "unfollow",
  FOLLOW_REQUEST: "follow_request",
  FOLLOW_ACCEPTED: "accept_request",
  FOLLOW_DECLINED: "decline_request",
  FOLLOW_CANCELED: "cancel_request",
  NEW_CHAT: "newGroup",
  MESSAGE: true,
  COMMENT: true,
  START_DM: true,
  JOINED_CHAT: true,
  CHAT_DELETED: true,
  USER_REMOVED: true,
  USER_REMOVED_NOTICE: true,
};

const settings = {
  like: "LIKE",
  follow_request: "FOLLOW_REQUEST",
  accept_request: "FOLLOW_ACCEPTED",
  decline_request: "FOLLOW_DECLINED",
  cancel_request: "FOLLOW_CANCELED",
  follow: "FOLLOW",
  unfollow: "UNFOLLOW",
  newGroup: "NEW_CHAT",
};

module.exports.settingToEvent = function (setting) {
  return settings[setting];
};

module.exports.eventToSetting = function (event) {
  return events[event];
};
