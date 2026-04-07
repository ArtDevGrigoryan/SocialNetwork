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
const eventBus = require("./event-bus");

class FriendService {
  async follow(sender, receiver) {
    if (sender.toString() === receiver.toString()) {
      throw new ConflictException("Cannot follow yourself");
    }
    const { profileVisibility, notificationSettings } =
      await PolicyService.canInitiateFollow(sender, receiver);

    const { message } = await followTx(sender, receiver, profileVisibility);
    if (notificationSettings.follow) {
      eventBus.emitEvent("notify.follow", { entity: sender });
    }
    return message;
  }
  async accept(receiver, requestId) {
    const { notificationSettings, sender } =
      await PolicyService.canRequestReaction(receiver, requestId);
    await acceptRequestTx(requestId);
    if (notificationSettings.accept_request) {
      eventBus.emitEvent("follow.accepted", {
        user: sender,
        entity: receiver,
        entityModel: "User",
      });
    }
    return true;
  }
  async decline(receiver, requestId) {
    const { sender, notificationSettings } =
      await PolicyService.canRequestReaction(receiver, requestId);

    await declineRequestTx(requestId);
    if (notificationSettings.decline_request) {
      eventBus.emitEvent("follow.declined", {
        user: sender,
        entity: receiver,
        entityModel: "User",
      });
    }
    return true;
  }
  async cancel(receiver, requestId) {
    const { notificationSettings, sender } =
      await PolicyService.canRequestReaction(receiver, requestId);

    await cancelRequestTx(requestId);
    if (notificationSettings.cancel_request) {
      eventBus.emitEvent("follow.canceled", {
        user: sender,
        entity: receiver,
        entityModel: "User",
      });
    }
    return true;
  }
  async unfollow(myId, targetId) {
    const { notificationSettings } = await PolicyService.canInitiateUnfollow(
      myId,
      targetId,
    );
    await unfollowTx(myId, targetId);
    if (notificationSettings.unfollow) {
      eventBus.emitEvent("unfollow", {
        user: targetId,
        entity: myId,
        entityModel: "User",
      });
    }
    return true;
  }
  async followerList(userId, limit = 20, page = 1) {
    const skip = (page - 1) * limit;
    return await Follow.find({ following: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("follower", "_id username avatar");
  }
  async followingList(userId, limit = 20, page = 1) {
    const skip = (page - 1) * limit;
    return await Follow.find({ follower: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("following", "_id username avatar");
  }
}

module.exports = new FriendService();
