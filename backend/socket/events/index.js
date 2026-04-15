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
  join_post: event(isAuth, socketEvent.join_post.bind(socketEvent)),
  leave_post: event(isAuth, socketEvent.leave_post.bind(socketEvent)),
  join_chat: event(isAuth, socketEvent.join_chat.bind(socketEvent)),
  typing: event(isAuth, socketEvent.typing.bind(socketEvent)),
  voice: event(isAuth, socketEvent.voice.bind(socketEvent)),
};
