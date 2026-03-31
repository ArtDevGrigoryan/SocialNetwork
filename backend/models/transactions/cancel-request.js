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
      const existingNotification = await Notification.findOne(
        {
          user: receiver,
          entity: sender,
          type: "FOLLOW_CANCELED",
        },
        null,
        { session },
      );
      if (existingNotification) {
        existingNotification.isRead = false;
        existingNotification.isSended = false;
        await existingNotification.save({ session });
      }
      const notification = !existingNotification
        ? await Notification.create(
            [
              {
                user: receiver,
                entity: sender,
                entityModel: "User",
                type: "FOLLOW_CANCELED",
              },
            ],
            { session },
          )
        : [existingNotification];
      result.notification = notification[0]._id;
      return result;
    });
    return result;
  } catch (err) {
    throw err;
  } finally {
    await session.endSession();
  }
};
