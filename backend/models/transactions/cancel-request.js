const { SocketBadRequestException } = require("@helpers/socket-errors");
const FriendRequest = require("@models/friend-request");
const Notification = require("@models/notification");
const mongoose = require("mongoose");

module.exports = async function cancelRequest(sender, receiver) {
  const session = await mongoose.startSession();
  try {
    const result = { notification: null };
    await session.withTransaction(async () => {
      const request = await FriendRequest.findOne({ sender, receiver }, null, {
        session,
      });
      if (!request || request.status != "PENDING") {
        throw new SocketBadRequestException("Somethig went wrong");
      }
      await FriendRequest.findByIdAndUpdate(
        request._id,
        {
          status: "DECLINED",
        },
        { session },
      );
      const notification = await Notification.create(
        [
          {
            user: receiver,
            entityId: sender,
            type: "FOLLOW_CANCELED",
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
