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

module.exports = async function followTransaction(
  sender,
  receiver,
  profileVisibility,
) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const status = profileVisibility == "PRIVATE" ? "PENDING" : "ACCEPTED";
      const existing = await FriendReqeust.findOneAndUpdate(
        {
          sender,
          receiver,
          status: "DECLINED",
        },
        { status },
        { new: true, upsert: true },
      ).session(session);

      let msg = "FOLLOW_REQUEST";
      if (status == "ACCEPTED") {
        await addFollow(sender, receiver, session);
        msg = "FOLLOW";
      }
      return { message: msg };
    });
  } finally {
    await session.endSession();
  }
};
