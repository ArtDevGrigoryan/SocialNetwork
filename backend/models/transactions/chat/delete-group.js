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

module.exports = async function deleteGroupTx(userId, chatId) {
  const session = await mongoose.startSession();
  try {
    const result = { notifications: null };
    await session.withTransaction(async () => {
      const [chat, participantIds, admin] = await Promise.all([
        Chat.findById(chatId).session(session),
        Participants.find({
          chatId,
          user: { $ne: userId },
          isMuted: false,
        })
          .select("_id")
          .session(session),
        Participants.findOne({ user: userId, chatId, role: "admin" }).session(
          session,
        ),
      ]);

      if (!chat) {
        throw new SocketNotFoundException(null, "Chat not found");
      }
      if (!admin) {
        throw new SocketConflictException(
          null,
          "Cannot access or delete this group",
        );
      }
      const settings = await Settings.find({
        user: {
          $in: participantIds,
        },
      });
      const notifs = await settingsNotifs(
        {
          type: "CHAT_DELETED",
          entity: userId,
          settings,
          propName: "group_removed",
          entityModel: "User",
        },
        session,
      );
      return (result.notifications = notifs);
    });
    return result;
  } finally {
    await session.endSession();
  }
};
