const mongoose = require("mongoose");
const Notification = require("@models/notification");
const FriendRequest = require("@models/friend-request");
const { removeFollow } = require("@transaction/helpers/follow");
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
      const existingNotification = await Notification.findOne(
        { user: sender, entity: receiver, type: "FOLLOW_DECLINED" },
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
                user: sender,
                entity: receiver,
                entityModel: "User",
                type: "FOLLOW_DECLINED",
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
