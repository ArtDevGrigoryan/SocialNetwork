const mongoose = require("mongoose");
const Notification = require("@models/notification");
const FriendRequest = require("@models/friend-request");
const { removeFollow } = require("@models/transactions/helpers/follow");
const { SocketBadRequestException } = require("@helpers/socket-errors");

module.exports = async function declineRequest(sender, receiver) {
  const session = await mongoose.startSession();
  try {
    const result = { notification: null };
    await session.withTransaction(async () => {
      const request = await FriendRequest.findOne({ sender, receiver }, null, {
        session,
      });
      if (!request || request?.status != "PENDING") {
        throw new SocketBadRequestException("Something went wrong");
      }
      await FriendRequest.findByIdAndUpdate(
        request._id,
        { status: "DECLINED" },
        { session },
      );
      const notification = await Notification.create(
        [
          {
            user: sender,
            entityId: receiver,
            type: "FOLLOW_DECLINED",
          },
        ],
        { session },
      );
      result.notification = notification._id;
      return result;
    });
    return result;
  } catch (err) {
    throw err;
  } finally {
    await session.endSession();
  }
};
