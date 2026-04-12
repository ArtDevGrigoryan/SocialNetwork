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
  typeing: event(isAuth),
  voice: event(isAuth),
};
