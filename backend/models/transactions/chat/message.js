const mongoose = require("mongoose");
const Chat = require("@models/chat");
const Message = require("@models/message");
const Notification = require("@models/notification");
const Settings = require("@models/setting");
const Block = require("@models/blocked-user");

const {
  SocketNotFoundException,
  SocketConflictException,
} = require("@helpers/socket-errors");
const { cache } = require("@db/redis");
const Participants = require("@models/participants");
const settingsNotifs = require("@transaction/helpers/settings-notifs");

module.exports = async function sendMessage(userId, chatId, data) {
  const session = await mongoose.startSession();

  try {
    const result = { notifications: null, message: null };
    await session.withTransaction(async () => {
      const [chat, participants] = await Promise.all([
        Chat.findById(chatId).session(session),
        Participants.find({
          chatId,
          // user: { $ne: userId },
        }).session(session),
      ]);
      if (!chat) {
        throw new SocketNotFoundException(null, "Chat not found");
      }
      const isMember = participants.some(
        (p) => p.user.toString() === userId.toString(),
      );

      if (!isMember) {
        throw new SocketConflictException("Not a member of chat");
      }

      if (chat.type == "dm") {
        const blocked = await Block.findOne({
          blocker: participants[0]._id,
          blocked: userId,
        }).session(session);
        if (blocked) {
          throw new SocketConflictException(null, "Blocked User");
        }
      }

      const [message] = await Message.create(
        [
          {
            chat: chatId,
            sender: userId,
            ...data,
          },
        ],
        { session },
      );

      let receivers = [];
      for (const p of participants) {
        if (p.user.toString() !== userId.toString()) {
          p.unreadCount += 1;
          receivers.push(p.user);
        }
      }

      chat.lastMessage = message._id;
      chat.lastActivityAt = new Date();

      await chat.save({ session });

      const participantIds = participants
        .map((p) => (p.isMuted ? null : p.user))
        .filter(Boolean);

      const settings = await Settings.findMany(
        participantIds.map((id) => ({
          user: id,
        })),
      );
      const notifs = await settingsNotifs(
        {
          settings,
          propName: "message",
          type: "MESSAGE",
          entity: message._id,
          entityModel: "Message",
        },
        session,
      );
      result.notifications = notifs;
      result.message = message;
      return result;
    });
    return result;
  } finally {
    await session.endSession();
  }
};
