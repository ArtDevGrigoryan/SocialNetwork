const mongoose = require("mongoose");
const FriendRequest = require("@models/friend-request");
const Settings = require("@models/setting");
const Notification = require("@models/notification");
const { removeFollow } = require("@transaction/helpers/follow");
const { SocketConflictException } = require("@helpers/socket-errors");

module.exports = async function unfollow(myId, targetId) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await FriendRequest.findOneAndUpdate(
        {
          sender: myId,
          receiver: targetId,
          status: { $ne: "DECLINED" },
        },
        { status: "DECLINED" },
      ).session(session);

      await removeFollow(myId, targetId, session);
    });
  } finally {
    await session.endSession();
  }
};
