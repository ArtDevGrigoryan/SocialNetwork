const mongoose = require("mongoose");
const User = require("@models/user");
const FriendReqeust = require("@models/friend-request");
const Notification = require("@models/notification");
const { addFollow } = require("@models/transactions/helpers/follow");
const Follow = require("@models/follow");
const { SocketConflictException } = require("@helpers/socket-errors");

module.exports = async function followTransaction(sender, receiver) {
  const session = await mongoose.startSession();

  try {
    let result = { message: null, notification: null };
    await session.withTransaction(async () => {
      const existing = await FriendReqeust.findOne({ sender, receiver }, null, {
        session,
      });
      const receiverUser = await User.findById(receiver, null, { session });

      if (existing && existing.status != "DECLINED") {
        throw new SocketConflictException("Already followed");
      }
      if (existing) {
        const status = receiverUser.isPrivate ? "PENDING" : "ACCEPTED";
        let type = "FOLLOW_REQUEST";
        if (status == "ACCEPTED") {
          await addFollow(sender, receiver, session);
          type = "FOLLOW";
        }
        const notification = await Notification.create(
          [
            {
              user: receiver,
              entityId: sender,
              type,
            },
          ],
          { session },
        );
        await FriendReqeust.findByIdAndUpdate(
          existing._id,
          { status },
          { session },
        );
        result.message = receiverUser.isPrivate ? "Request-sent" : "Followed";
        result.notification = notification._id;
        return result;
      }
      const status = receiverUser.isPrivate ? "PENDING" : "ACCEPTED";
      const request = await FriendReqeust.create(
        [{ sender, receiver, status }],
        { session },
      );
      let type = "FOLLOW_REQUEST";
      if (status == "ACCEPTED") {
        await addFollow(sender, receiver, session);
        type = "FOLLOW";
      }
      const notification = await Notification.create(
        [{ user: receiver, entityId: sender, type }],
        { session },
      );
      result.message = receiverUser.isPrivate ? "Request-sent" : "Followed";
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
