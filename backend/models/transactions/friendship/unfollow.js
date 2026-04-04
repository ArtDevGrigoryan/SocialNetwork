const mongoose = require("mongoose");
const FriendRequest = require("@models/friend-request");
const Settings = require("@models/setting");
const Notification = require("@models/notification");
const { removeFollow } = require("@transaction/helpers/follow");
const { SocketConflictException } = require("@helpers/socket-errors");

module.exports = async function unfollow(myId, targetId) {
  const session = await mongoose.startSession();
  try {
    const result = { notification: null };
    await session.withTransaction(async () => {
      const [request, setting] = await Promise.all([
        FriendRequest.findOneAndUpdate(
          {
            sender: myId,
            receiver: targetId,
            status: { $ne: "DECLINED" },
          },
          { status: "DECLINED" },
        ).session(session),
        Settings.findOne({ user: targetId }).session(session),
      ]);
      if (!request) {
        throw new SocketConflictException("Already unfollowed");
      }
      await removeFollow(myId, targetId, session);
      const isSended = !setting.notifications.unfollow;
      const existingNotification = await Notification.findOne(
        { user: targetId, entity: myId, type: "UNFOLLOW" },
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
                user: targetId,
                entity: myId,
                entityModel: "User",
                type: "UNFOLLOW",
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
