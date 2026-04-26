const { SocketBadRequestException } = require("@helpers/socket-errors");
const FriendRequest = require("@models/friend-request");
const mongoose = require("mongoose");
const { addFollow } = require("@transaction/helpers/follow");

module.exports = async function acceptRequest(requestId) {
  const session = await mongoose.startSession();
  try {
    let request;
    await session.withTransaction(async () => {
      request = await FriendRequest.findOneAndUpdate(
        { _id: requestId, status: "PENDING" },
        { $set: { status: "ACCEPTED" } },
        { new: true },
      ).session(session);

      if (request) {
        await addFollow(request.sender, request.receiver, session);
      }
    });
    return request;
  } finally {
    await session.endSession();
  }
};
