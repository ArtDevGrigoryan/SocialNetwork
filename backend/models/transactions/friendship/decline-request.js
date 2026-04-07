const mongoose = require("mongoose");
const Notification = require("@models/notification");
const FriendRequest = require("@models/friend-request");
const Settings = require("@models/setting");
const { removeFollow } = require("@transaction/helpers/follow");
const { SocketBadRequestException } = require("@helpers/socket-errors");

module.exports = async function declineRequest(requestId) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const request = await FriendRequest.findOneAndUpdate(
        { _id: requestId, status: "PENDING" },
        { $set: { status: "DECLINED" } },
      ).session(session);
    });
  } finally {
    await session.endSession();
  }
};
