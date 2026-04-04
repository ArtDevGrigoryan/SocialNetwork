const mongoose = require("mongoose");
const followTx = require("@models/transactions/friendship/follow");
const unfollowTx = require("@models/transactions/friendship/unfollow");
const cancelRequestTx = require("@models/transactions/friendship/cancel-request");
const acceptRequestTx = require("@models/transactions/friendship/accept-request");
const declineRequestTx = require("@models/transactions/friendship/decline-request");
const Follow = require("@models/follow");
const { SocketConflictException } = require("@helpers/socket-errors");
const FriendRequest = require("@models/friend-request");

class FriendService {
  async follow(sender, receiver) {
    if (sender.toString() === receiver.toString()) {
      throw new SocketConflictException(null, "Cannot follow yourself");
    }
    return followTx(sender, receiver);
  }

  async accept(sender, receiver) {
    return acceptRequestTx(sender, receiver);
  }

  async decline(sender, receiver) {
    return declineRequestTx(sender, receiver);
  }

  async cancel(sender, receiver) {
    return cancelRequestTx(sender, receiver);
  }

  async unfollow(myId, targetId) {
    return unfollowTx(myId, targetId);
  }

  followerList(userId, limit = 20, page = 1) {
    const skip = (page - 1) * limit;
    return Follow.find({ following: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("follower", "_id username avatar");
  }
  followingList(userId, limit = 20, page = 1) {
    const skip = (page - 1) * limit;
    return Follow.find({ follower: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("following", "_id username avatar");
  }
  handleBlock(userId, targetId) {
    return Promise.all([
      Follow.deleteMany({
        $or: [
          { follower: userId, following: targetId },
          { follower: targetId, following: userId },
        ],
      }),

      FriendRequest.deleteMany({
        $or: [
          { sender: userId, receiver: targetId },
          { sender: targetId, receiver: userId },
        ],
      }),
    ]);
  }
}

module.exports = new FriendService();
