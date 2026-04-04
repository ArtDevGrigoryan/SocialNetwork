const mongoose = require("mongoose");
const User = require("@models/user");
const FriendReqeust = require("@models/friend-request");
const Block = require("@models/blocked-user");
const Notification = require("@models/notification");
const Settings = require("@models/setting");
const { addFollow } = require("@transaction/helpers/follow");
const Follow = require("@models/follow");
const {
  SocketConflictException,
  SocketNotFoundException,
} = require("@helpers/socket-errors");

module.exports = async function followTransaction(sender, receiver) {
  const session = await mongoose.startSession();

  try {
    let result = { message: null, notification: null };
    return await session.withTransaction(async () => {
      const [existing, settings, block] = await Promise.all([
        FriendReqeust.findOne({ sender, receiver, status: "DECLINED" }).session(
          session,
        ),
        Settings.findOne({ user: receiver }).session(session),
        Block.findOne({ blocker: receiver, blocked: sender }).session(session),
      ]);
      if (block) {
        throw new SocketConflictException(null, "Blocked");
      }
      if (!existing) {
        throw new SocketConflictException(null, "Already followed");
      }
      if (!settings) {
        throw new SocketNotFoundException(null, "User settings not found");
      }
      const status =
        settings.privacy.profileVisibility == "PRIVATE"
          ? "PENDING"
          : "ACCEPTED";
      const [firendRequest] = !existing
        ? await FriendReqeust.create([{ sender, receiver, status }], {
            session,
          })
        : [existing];

      let type = "FOLLOW_REQUEST";
      if (status == "ACCEPTED") {
        await addFollow(sender, receiver, session);
        type = "FOLLOW";
      }
      const isSended = !settings.notifications.follow;
      const existingNotification = await Notification.findOne({
        user: receiver,
        entity: sender,
        type,
      }).session(session);
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
                type,
                isSended,
              },
            ],
            { session },
          )
        : [existingNotification];

      result.notification = isSended ? null : notification._id;
      result.message = status == "PENDING" ? "Request-sent" : "Followed";
      return result;
    });
    return result;
  } catch (err) {
    throw err;
  } finally {
    await session.endSession();
  }
};
