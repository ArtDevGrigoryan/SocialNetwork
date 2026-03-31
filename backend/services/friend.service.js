const mongoose = require("mongoose");
const followTx = require("@transaction/follow");
const unfollowTx = require("@transaction/unfollow");
const cancelRequestTx = require("@transaction/cancel-request");
const acceptRequestTx = require("@transaction/accept-request");
const declineRequestTx = require("@transaction/decline-request");
const Follow = require("@models/follow");
const { SocketConflictException } = require("@helpers/socket-errors");

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
}

module.exports = new FriendService();
