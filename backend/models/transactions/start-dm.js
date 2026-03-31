const mongoose = require("mongoose");
const Chat = require("@models/chat");
const User = require("@models/user");

module.exports = async function startDM(userId, targetId) {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const targetUser = await User.findById(targetId, null, { session });
      if (!targetUser) throw new Error("User not found");

      let chat = await Chat.findOne(
        {
          type: "dm",
          "participants.user": { $all: [userId, targetId] },
          participants: { $size: 2 },
        },
        null,
        { session },
      );

      if (!chat) {
        [chat] = await Chat.create(
          [
            {
              type: "dm",
              participants: [{ user: userId }, { user: targetId }],
            },
          ],
          { session },
        );
      }

      return chat;
    });
  } finally {
    await session.endSession();
  }
};
