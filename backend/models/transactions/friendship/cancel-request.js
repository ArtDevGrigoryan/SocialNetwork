const { SocketBadRequestException } = require("@helpers/socket-errors");
const FriendRequest = require("@models/friend-request");
const Notification = require("@models/notification");
const Settings = require("@models/setting");
const mongoose = require("mongoose");

module.exports = async function cancelRequest(sender, receiver) {
  const session = await mongoose.startSession();
  try {
    const result = { notification: null };
    await session.withTransaction(async () => {
      const [request, settings] = await Promise.all([
        FriendRequest.findOneAndUpdate(
          { sender, receiver, status: "PENDING" },
          { $set: { status: "DECLINED" } },
        ).session(session),
        Settings.findOne({ user: receiver }).session(session),
      ]);
      if (!request) {
        throw new SocketBadRequestException("Somethig went wrong");
      }
      const isSended = !settings.notifications.cancel_request;
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
        existingNotification.isSended = isSended;
        await existingNotification.save({ session });
      }
      const [notification] = !existingNotification
        ? await Notification.create(
            [
              {
                user: receiver,
                entity: sender,
                entityModel: "User",
                type: "FOLLOW_CANCELED",
                isSended,
              },
            ],
            { session },
          )
        : [existingNotification];
      result.notification = isSended ? null : notification._id;
      return result;
    });
    return result;
  } catch (err) {
    throw err;
  } finally {
    await session.endSession();
  }
};
