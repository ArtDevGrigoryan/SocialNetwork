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

module.exports = async function removeUserTx(
  removerParticipantId,
  chatId,
  participantId,
) {
  const session = await mongoose.startSession();
  try {
    const result = { notifications: null };
    await session.withTransaction(async () => {
      const [chat, remover] = await Promise.all([
        Chat.findById(chatId).session(session),
        Participant.findOne({ _id: removerParticipantId, role: "admin" }),
      ]);
      if (!chat) {
        throw new SocketNotFoundException(null, "Chat not found");
      }
      if (!remover) {
        throw new SocketConflictException(
          null,
          "Cannot access delete participant",
        );
      }
      const deleted = await Participant.findOneAndDelete({
        _id: participantId,
        chatId,
      }).session(session);

      if (!deleted) {
        throw new SocketConflictException(
          null,
          "Participant is not a member of this chat",
        );
      }
      const participantIds = await Participant.find({
        chatId,
        _id: { $ne: [removerParticipantId, participantId] },
        isMuted: false,
      })
        .select("_id")
        .session(session);

      const settings = await Setting.find(
        {
          user: {
            $in: participantIds,
          },
        },
        null,
        { session },
      );
      const deletedSetting = await Setting.findOne({ user: deleted.user });

      const notifs = await notificationHelper(
        {
          settings: settings,
          propName: "group_member_removed_notice",
          entity: userId.toString(),
          entityModel: "User",
          type: "USER_REMOVED_NOTICE",
        },
        session,
      );

      const deletedUserNotif = await notificationHelper(
        {
          settings: deletedSetting,
          propName: "group_member_removed",
          type: "USER_REMOVED",
          entity: userId,
          entityModel: "User",
        },
        session,
      );
      notifs.push(...deletedUserNotif);
      result.notifications = notifs;
    });
    return result;
  } catch (err) {
    throw err;
  } finally {
  }
};
