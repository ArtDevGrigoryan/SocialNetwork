const event = require("../core/event");
const socketEvent = require("./socket-event");
const isAuth = require("../middlewares/is-auth");
const { joinRoomSchema, followSchema } = require("@schemas/socket.schema");
const validate = require("../middlewares/validate");

module.exports = {
  connection: event(isAuth, socketEvent.connection.bind(socketEvent)),
  disconnect: event(isAuth, socketEvent.disconnect.bind(socketEvent)),
  join_room: event(
    isAuth,
    validate(joinRoomSchema),
    socketEvent.joinRoom.bind(socketEvent),
  ),
  follow: event(isAuth, validate(followSchema), socketEvent.follow),
  unfollow: event(isAuth, validate(followSchema), socketEvent.unfollow),
  accept_request: event(
    isAuth,
    validate(followSchema),
    socketEvent.acceptRequest,
  ),
  decline_request: event(
    isAuth,
    validate(followSchema),
    socketEvent.declineRequest,
  ),
  cancel_request: event(
    isAuth,
    validate(followSchema),
    socketEvent.cancelRequest,
  ),
};
