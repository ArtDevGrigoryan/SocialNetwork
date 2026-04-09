const mongoose = require("mongoose");
const Message = require("@models/message");
const Participants = require("@models/participants");
const { ForBiddenException } = require("@helpers/errors");
const Chat = require("@models/chat");
const PolicyService = require("@services/policy.service");

module.exports = async function deleteMsgTx(userId, msgId) {
  const session = await mongoose.startSession();
  try {
    const result = { key: null };
    await session.withTransaction(async () => {
      const message = await PolicyService.canAccessMessage(
        userId,
        msgId,
        session,
      );
      await Message.findOneAndUpdate(
        { _id: message._id },
        { deletedAt: new Date() },
      ).session(session);
      const chat = await Chat.findById(message.chat).session(session);

      if (chat.lastMessage.toString() == message._id) {
        const lastMsg = await Message.findOne({
          chat: message.chat,
          deletedAt: null,
        })
          .sort({ createdAt: -1 })
          .session(session);

        await Chat.updateOne(
          { _id: message.chat },
          { lastMessage: lastMsg._id },
        ).session(session);
      }
      result.key = message.voice.key;
    });
    return result;
  } finally {
    await session.endSession();
  }
};
