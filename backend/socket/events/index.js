const event = require("../core/event");
const socketEvent = require("./socket-event");
const isAuth = require("../middlewares/is-auth");
const { joinRoomSchema } = require("@schemas/socket.schema");
const validate = require("../middlewares/validate");

module.exports = {
  connection: event(isAuth, socketEvent.connection.bind(socketEvent)),
  disconnect: event(isAuth, socketEvent.disconnect.bind(socketEvent)),
  join_room: event(
    isAuth,
    validate(joinRoomSchema),
    socketEvent.joinRoom.bind(socketEvent),
  ),
  // follow: event(isAuth, validate(followSchema), socketEvent.follow)
};
