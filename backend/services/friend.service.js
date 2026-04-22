const mongoose = require("mongoose");
const followTx = require("@models/transactions/friendship/follow");
const unfollowTx = require("@models/transactions/friendship/unfollow");
const cancelRequestTx = require("@models/transactions/friendship/cancel-request");
const acceptRequestTx = require("@models/transactions/friendship/accept-request");
const declineRequestTx = require("@models/transactions/friendship/decline-request");
const Follow = require("@models/follow");
const { SocketConflictException } = require("@helpers/socket-errors");
const FriendRequest = require("@models/friend-request");
const {
  ConflictException,
  NotFoundException,
  BadRequestException,
} = require("@helpers/errors");
const PolicyService = require("@services/policy.service");
const notificationService = require("./notification.service");

class FriendService {
  async follow(sender, receiver) {
    if (sender.toString() === receiver.toString()) {
      throw new ConflictException("Cannot follow yourself");
    }
    const { profileVisibility } = await PolicyService.canInitiateFollow(
      sender,
      receiver,
    );

    const { message } = await followTx(sender, receiver, profileVisibility);
    await notificationService.followNotification({
      fromUser: sender,
      toUser: receiver,
    });
    return message;
  }
  async accept(receiver, requestId) {
    const sender = await PolicyService.canRequestReaction(receiver, requestId);
    await acceptRequestTx(requestId);
    await notificationService.acceptRequestNotification({
      fromUser: receiver,
      toUser: sender,
    });
    return true;
  }
  async decline(receiver, requestId) {
    const sender = await PolicyService.canRequestReaction(receiver, requestId);

    await declineRequestTx(requestId);
    await notificationService.declineRequestNotification({
      fromUser: receiver,
      toUser: sender,
    });
    return true;
  }
  async cancel(sender, requestId) {
    const receiver = await PolicyService.canRequestReaction(sender, requestId);
    await cancelRequestTx(requestId);
    await notificationService.cancelRequestNotification({
      fromUser: sender,
      toUser: receiver,
    });
    return true;
  }
  async unfollow(myId, targetId) {
    await PolicyService.canInitiateUnfollow(myId, targetId);
    await unfollowTx(myId, targetId);
    await notificationService.unfollowNotification({
      fromUser: myId,
      toUser: targetId,
    });
    return true;
  }
  async followerList(viewer, userId, limit = 20, page = 1) {
    await PolicyService.canViewProfile(viewer, userId);
    const skip = (page - 1) * limit;
    return await Follow.find({ following: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("follower", "_id username avatar");
  }
  async followingList(viewer, userId, limit = 20, page = 1) {
    await PolicyService.canViewProfile(viewer, userId);
    const skip = (page - 1) * limit;
    return await Follow.find({ follower: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("following", "_id username avatar");
  }
  async requests(userId, { type = "incoming", page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const baseQuery =
      type === "outgoing"
        ? { sender: userId, status: "PENDING" }
        : { receiver: userId, status: "PENDING" };
    return FriendRequest.find(baseQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "_id username avatar bio")
      .populate("receiver", "_id username avatar bio");
  }
}

module.exports = new FriendService();
