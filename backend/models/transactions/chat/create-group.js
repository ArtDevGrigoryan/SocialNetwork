const Chat = require("@models/chat");
const Participants = require("@models/participants");
const mongoose = require("mongoose");

module.exports = async function createGroupTx(userIdsWithRole, data) {
  const session = await mongoose.startSession();
  try {
    const result = { chat: null };
    await session.withTransaction(async () => {
      const chat = await Chat.create({ type: "group", ...data }, { session });
      await Participants.insertMany(
        userIdsWithRole.map((obj) => ({ ...obj, chatId: chat._id })),
        { session },
      );
      result.chat = chat;
    });
    return result;
  } finally {
    await session.endSession();
  }
};
