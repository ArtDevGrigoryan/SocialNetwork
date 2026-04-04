const Message = require("@models/message");
const Participants = require("@models/participants");
const { default: mongoose } = require("mongoose");

module.exports = async function cascadeDeleteChat(next) {
  const session = await mongoose.startSession();
  const doc = this;
  try {
    await session.withTransaction(async () => {
      await Promise.all([
        Message.deleteMany({ chat: doc._id }).session(session),
        Participants.deleteMany({ chatId: doc._id }).session(session),
      ]);
    });
    next();
  } finally {
    await session.endSession();
    next();
  }
};
