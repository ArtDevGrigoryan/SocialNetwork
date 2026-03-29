const mongoose = require("mongoose");
const FriendRequest = require("@models/friend-request");
const Notification = require("@models/notification");
const { removeFollow } = require("./helpers/follow");

module.exports = async function unfollow(myId, targetId) {
  const session = await mongoose.startSession();
  try {
    const result = { notification: null };
    await session.withTransaction(async () => {
      const request = await FriendRequest.findOneAndUpdate(
        {
          sender: myId,
          receiver: targetId,
        },
        { status: "DECLINED" },
        { session },
      );
      await removeFollow(myId, targetId, session);
      const notification = await Notification.create(
        [
          {
            user: targetId,
            entityId: myId,
            type: "UNFOLLOW",
          },
        ],
        { session },
      );
      result.notification = notification._id;
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
