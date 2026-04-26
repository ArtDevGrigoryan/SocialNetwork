const FriendRequest = require("@models/friend-request");
const mongoose = require("mongoose");

module.exports = async function cancelRequest(requestId) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await FriendRequest.findOneAndUpdate(
        { _id: requestId, status: "PENDING" },
        { $set: { status: "DECLINED" } },
      ).session(session);
    });
    return true;
  } finally {
    await session.endSession();
  }
};
