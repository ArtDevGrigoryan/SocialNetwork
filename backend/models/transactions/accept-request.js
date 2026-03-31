const { SocketBadRequestException } = require("@helpers/socket-errors");
const FriendRequest = require("@models/friend-request");
const Notification = require("@models/notification");
const mongoose = require("mongoose");
const { addFollow } = require("@transaction/helpers/follow");

module.exports = async function acceptRequest(sender, receiver) {
  const session = await mongoose.startSession();
  let result = { notification: null };
  try {
    await session.withTransaction(async () => {
      const request = await FriendRequest.findOne({ sender, receiver }, null, {
        session,
      });
      if (!request || request?.status != "PENDING") {
        throw new SocketBadRequestException("Something went wrong");
      }
      await FriendRequest.findByIdAndUpdate(
        request._id,
        { status: "ACCEPTED" },
        { session },
      );
      const existingNotification = await Notification.findOne(
        {
          user: sender,
          entity: receiver,
          type: "FOLLOW_ACCEPTED",
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
                user: sender,
                entity: receiver,
                entityModel: "User",
                type: "FOLLOW_ACCEPTED",
              },
            ],
            { session },
          )
        : [existingNotification];
      await addFollow(sender, receiver, session);
      result.notification = notification[0]._id;
      return result;
    });
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    await session.endSession();
  }
};
