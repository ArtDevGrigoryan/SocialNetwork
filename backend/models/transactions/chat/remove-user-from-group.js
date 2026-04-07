const mongoose = require("mongoose");
const Chat = require("@models/chat");
const Setting = require("@models/setting");
const Notification = require("@models/notification");
const Participant = require("@models/participants");
const notificationHelper = require("@models/transactions/helpers/settings-notifs");

const {
  SocketNotFoundException,
  SocketConflictException,
} = require("@helpers/socket-errors");

module.exports = async function removeUserTx(participantId) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Participant.deleteOne({ _id: participantId }).session(session);
    });
    return result;
  } finally {
  }
};
