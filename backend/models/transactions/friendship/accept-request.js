const { SocketBadRequestException } = require("@helpers/socket-errors");
const FriendRequest = require("@models/friend-request");
const Notification = require("@models/notification");
const Settings = require("@models/setting");
const mongoose = require("mongoose");
const { addFollow } = require("@transaction/helpers/follow");

module.exports = async function acceptRequest(sender, receiver) {
  const session = await mongoose.startSession();
  let result = { notification: null };
  try {
    await session.withTransaction(async () => {
      const [request, settings] = await Promise.all([
        FriendRequest.findOneAndUpdate(
          { sender, receiver, status: "PENDING" },
          { $set: { status: "ACCEPTED" } },
        ).session(session),
        Settings.findOne({ user: receiver }).session(session),
      ]);
      if (!request) {
        throw new SocketBadRequestException("Something went wrong");
      }

      const isSended = !settings.notifications.accept_request;

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
                type: "FOLLOW_ACCEPTED",
                isSended,
              },
            ],
            { session },
          )
        : [existingNotification];
      await addFollow(sender, receiver, session);

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
