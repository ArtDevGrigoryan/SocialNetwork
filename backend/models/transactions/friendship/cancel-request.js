const { SocketBadRequestException } = require("@helpers/socket-errors");
const FriendRequest = require("@models/friend-request");
const Notification = require("@models/notification");
const Settings = require("@models/setting");
const mongoose = require("mongoose");

module.exports = async function cancelRequest(requestId) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const request = await FriendRequest.findOneAndUpdate(
        { _id: requestId, status: "PENDING" },
        { $set: { status: "DECLINED" } },
      ).session(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};
