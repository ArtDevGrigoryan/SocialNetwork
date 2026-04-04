const mongoose = require("mongoose");
const Notification = require("@models/notification");
const FriendRequest = require("@models/friend-request");
const Settings = require("@models/setting");
const { removeFollow } = require("@transaction/helpers/follow");
const { SocketBadRequestException } = require("@helpers/socket-errors");

module.exports = async function declineRequest(sender, receiver) {
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
        throw new SocketBadRequestException("Something went wrong");
      }
      const isSended = !settings.notifications.decline_request;

      const existingNotification = await Notification.findOne(
        { user: sender, entity: receiver, type: "FOLLOW_DECLINED" },
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
                user: sender,
                entity: receiver,
                entityModel: "User",
                type: "FOLLOW_DECLINED",
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
  } finally {
    await session.endSession();
  }
};
