const Follow = require("@models/follow");
const FriendRequest = require("@models/friend-request");
const {
  ConflictException,
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

    const status = profileVisibility == "PRIVATE" ? "PENDING" : "ACCEPTED";
    await FriendRequest.findOneAndUpdate(
      { sender, receiver },
      { sender, receiver, status },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    if (status === "ACCEPTED") {
      await Follow.updateOne(
        { follower: sender, following: receiver },
        { follower: sender, following: receiver },
        { upsert: true, setDefaultsOnInsert: true },
      );
      await notificationService.followNotification({
        fromUser: sender,
        toUser: receiver,
      });
      return "FOLLOW";
    }

    await notificationService.followRequestNotification({
      fromUser: sender,
      toUser: receiver,
    });
    return "FOLLOW_REQUEST";
  }
  async accept(receiver, sender) {
    const request = await FriendRequest.findOneAndUpdate(
      { sender, receiver, status: "PENDING" },
      { status: "ACCEPTED" },
      { new: true },
    );
    if (!request) {
      throw new ConflictException("Request not found or already handled");
    }
    await Follow.updateOne(
      { follower: sender, following: receiver },
      { follower: sender, following: receiver },
      { upsert: true, setDefaultsOnInsert: true },
    );
    await notificationService.acceptRequestNotification({
      fromUser: receiver,
      toUser: sender,
    });
    return true;
  }
  async decline(receiver, sender) {
    const request = await FriendRequest.findOneAndUpdate(
      { sender, receiver, status: "PENDING" },
      { status: "DECLINED" },
      { new: true },
    );
    if (!request) {
      throw new ConflictException("Request not found or already handled");
    }
    await notificationService.declineRequestNotification({
      fromUser: receiver,
      toUser: sender,
    });
    return true;
  }
  async cancel(sender, receiver) {
    const request = await FriendRequest.findOneAndUpdate(
      { sender, receiver, status: "PENDING" },
      { status: "DECLINED" },
      { new: true },
    );
    if (!request) {
      throw new ConflictException("Request not found or already handled");
    }
    await notificationService.cancelRequestNotification({
      fromUser: sender,
      toUser: receiver,
    });
    return true;
  }
  async unfollow(myId, targetId) {
    await PolicyService.canInitiateUnfollow(myId, targetId);
    await FriendRequest.findOneAndUpdate(
      { sender: myId, receiver: targetId, status: { $ne: "DECLINED" } },
      { status: "DECLINED" },
    );
    await Follow.deleteOne({ follower: myId, following: targetId });
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
  async requests(userId) {
    return FriendRequest.find({
      $or: [{ receiver: userId }, { sender: userId }],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "_id username avatar")
      .populate("receiver", "_id username avatar");
  }
}

module.exports = new FriendService();
