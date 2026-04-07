const mongoose = require("mongoose");
const FriendRequest = require("@models/friend-request");
const Follow = require("@models/follow");
const { removeFollow } = require("@transaction/helpers/follow");
const Chat = require("@models/chat");
const Participants = require("@models/participants");

module.exports = async function blockTx(blocker, blocked) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const follows = await Follow.find({
      $or: [
        { follower: blocker, following: blocked },
        { follower: blocked, following: blocker },
      ],
    }).session(session);

    for (const f of follows) {
      await removeFollow(f.follower, f.following, session);
    }

    await FriendRequest.deleteMany(
      {
        $or: [
          { sender: blocker, receiver: blocked },
          { sender: blocked, receiver: blocker },
        ],
      },
      { session },
    );
    
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }
};
