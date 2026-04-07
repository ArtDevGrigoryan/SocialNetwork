const mongoose = require("mongoose");
const Chat = require("@models/chat");
const Notification = require("@models/notification");
const Participants = require("@models/participants");
const Settings = require("@models/setting");

const {
  SocketNotFoundException,
  SocketConflictException,
} = require("@helpers/socket-errors");
const settingsNotifs = require("../helpers/settings-notifs");

module.exports = async function deleteGroupTx(chatId) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Chat.deleteOne({ _id: chatId }).session(session);
    });
  } finally {
    await session.endSession();
  }
};
