const { SocketBadRequestException } = require("@helpers/socket-errors");
const FriendRequest = require("@models/friend-request");
const Notification = require("@models/notification");
const Settings = require("@models/setting");
const mongoose = require("mongoose");
const { addFollow } = require("@transaction/helpers/follow");

module.exports = async function acceptRequest(requestId) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const request = await FriendRequest.findOneAndUpdate(
        { _id: requestId },
        { $set: { status: "ACCEPTED" } },
      ).session(session);
      await addFollow(request.sender, request.receiver, session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};
