const {
  SocketNotFoundException,
  SocketBadRequestException,
} = require("@helpers/socket-errors");
const Chat = require("@models/chat");
const Participants = require("@models/participants");
const Setting = require("@models/setting");
const mongoose = require("mongoose");
const settingsNotifs = require("../helpers/settings-notifs");

module.exports = async function disjoinChatTx(participantId, chatId) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const deleted = await Participants.findOneAndDelete({
        _id: participantId,
        chatId,
      }).session(session);

      const participants = await Participants.find({ chatId })
        .sort({ createdAt: 1 })
        .session(session);

      if (!participants.length) {
        await Chat.deleteOne({ _id: chatId }).session(session);
        return true;
      }

      const isAdmin = deleted.role == "admin";
      if (isAdmin) {
        const existAdmin = participants.find((p) => p.role == "admin");
        if (!existAdmin) {
          await Participants.updateOne({
            _id: participants[0]._id,
            role: "admin",
          }).session(session);
        } // [cite: 187]
      }
    });
  } finally {
    await session.endSession();
  }
};
