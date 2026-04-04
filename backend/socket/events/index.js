const event = require("../core/event");
const socketEvent = require("./socket-event");
const isAuth = require("../middlewares/is-auth");
const {
  joinRoomSchema,
  followSchema,
  markReadSchema,
  startDMSchema,
  messageSchema,
  createChatSchema,
  searchSchema,
  myNotifsSchema,
  createGroupSchema,
} = require("@schemas/socket.schema");
const validate = require("../middlewares/validate");

module.exports = {
  connection: event(isAuth, socketEvent.connection.bind(socketEvent)),
  disconnect: event(isAuth, socketEvent.disconnect.bind(socketEvent)),
  // join_room: event(
  //   isAuth,
  //   validate(joinRoomSchema),
  //   socketEvent.joinRoom.bind(socketEvent),
  // ),
  follow: event(
    isAuth,
    validate(followSchema),
    socketEvent.follow.bind(socketEvent),
  ),
  unfollow: event(
    isAuth,
    validate(followSchema),
    socketEvent.unfollow.bind(socketEvent),
  ),
  follow_accept: event(
    isAuth,
    validate(followSchema),
    socketEvent.acceptRequest.bind(socketEvent),
  ),
  follow_decline: event(
    isAuth,
    validate(followSchema),
    socketEvent.declineRequest.bind(socketEvent),
  ),
  follow_cancel: event(
    isAuth,
    validate(followSchema),
    socketEvent.cancelRequest.bind(socketEvent),
  ),
  followers_search: event(
    isAuth,
    validate(searchSchema),
    socketEvent.searchInFollowers,
  ),
  followings_search: event(
    isAuth,
    validate(searchSchema),
    socketEvent.searchInFollowings,
  ),
  user_search: event(isAuth, validate(searchSchema), socketEvent.search),
  notification_read: event(
    isAuth,
    validate(markReadSchema),
    socketEvent.markRead,
  ),
  notification_delete: event(
    isAuth,
    validate(markReadSchema),
    socketEvent.deleteNotification,
  ),
  notifications_my: event(
    isAuth,
    validate(myNotifsSchema),
    socketEvent.getNotifications,
  ),
  notifications_all_delete: event(isAuth, socketEvent.deleteAllNotifications),
  chat_dm_create: event(
    isAuth,
    validate(createChatSchema),
    socketEvent.createChatDM,
  ),
  chat_dm_delete: event(
    isAuth,
    validate(joinRoomSchema),
    socketEvent.deleteChatDM,
  ),
  chat_group_create: event(
    isAuth,
    validate(createGroupSchema),
    socketEvent.createChatGroup,
  ),
  chat_group_add_user: event(isAuth, validate(), socketEvent),
  chat_gruop_update: event(isAuth, validate(), socketEvent),
  chat_message_send: event(
    isAuth,
    validate(messageSchema),
    socketEvent.directMessage,
  ),
};
