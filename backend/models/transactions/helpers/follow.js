const User = require("@models/user");
const Follow = require("@models/follow");

async function removeFollow(sender, receiver, session) {
  await Promise.all([
    User.findByIdAndUpdate(
      receiver,
      [
        {
          $set: {
            followersCount: {
              $max: [{ $subtract: ["$followersCount", 1] }, 0],
            },
          },
        },
      ],
      { session, updatePipeline: true },
    ),
    User.findByIdAndUpdate(
      sender,
      [
        {
          $set: {
            followingCount: {
              $max: [{ $subtract: ["$followingCount", 1] }, 0],
            },
          },
        },
      ],
      { session, updatePipeline: true },
    ),
    Follow.deleteOne({ follower: sender, following: receiver }, { session }),
  ]);
}

async function addFollow(sender, receiver, session) {
  await Promise.all([
    User.findByIdAndUpdate(
      sender,
      { $inc: { followingCount: 1 } },
      { session },
    ),
    User.findByIdAndUpdate(
      receiver,
      { $inc: { followersCount: 1 } },
      { session },
    ),
    Follow.create([{ follower: sender, following: receiver }], { session }),
  ]);
}

module.exports = { addFollow, removeFollow };
