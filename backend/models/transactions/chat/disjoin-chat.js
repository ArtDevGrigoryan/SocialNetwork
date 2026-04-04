const {
  SocketNotFoundException,
  SocketBadRequestException,
} = require("@helpers/socket-errors");
const Chat = require("@models/chat");
const Participants = require("@models/participants");
const Setting = require("@models/setting");
const mongoose = require("mongoose");
const settingsNotifs = require("../helpers/settings-notifs");

module.exports = async function disjoinChatTx(userId, chatId) {
  const session = await mongoose.startSession();
  try {
    const result = { notifications: null };
    await session.withTransaction(async () => {
      const chat = await Chat.findById(chatId).session(session);
      if (!chat) {
        throw new SocketNotFoundException(null, "Chat not found");
      }
      if (chat.type == "dm") {
        throw new SocketBadRequestException(null, "Cannot disjoined this chat");
      }
      const deleted = await Participants.findOneAndDelete({
        user: userId,
        chatId,
      }).session(session);

      if (!deleted) {
        throw new SocketBadRequestException(null, "User is not a participant");
      }
      const participants = await Participants.find({ chatId }).session(session);
      if (!paricipants.length) {
        await chat.deleteOne({ session });
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
        }
      }
      const participantIds = participants
        .map((p) => (p.isMuted ? null : p.user))
        .filter(Boolean);
        
      const settings = await Setting.find({
        user: { $in: participantIds },
      }).session(session);

      const notifs = await settingsNotifs({
        settings,
        type: "USER_REMOVED_NOTICE",
        propName: "group_member_removed_notice",
        entitiy: userId,
        entitiyModel: "User",
      });
      result.notifications = notifs;
    });
    return result;
  } finally {
    await session.endSession();
  }
};
