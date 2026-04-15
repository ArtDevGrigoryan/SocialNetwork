const { SocketConflictException } = require("@helpers/socket-errors");
const { NotFoundException } = require("@helpers/errors");
const User = require("@models/user");
const Block = require("@models/blocked-user");
const Follow = require("@models/follow");
const FriendRequest = require("@models/friend-request");
const friendService = require("@services/friend.service");
const blockTx = require("@transaction/friendship/block");
const PolicyService = require("./policy.service");

class UserService {
  async checkExists(...ids) {
    const users = await User.find({ _id: { $in: ids } }).select("_id");

    const foundIds = new Set(users.map((u) => String(u._id)));

    return {
      allExist: ids.every((id) => foundIds.has(String(id))),
      missing: ids.filter((id) => !foundIds.has(String(id))),
    };
  }
  async updateStatus(id, status = "OFFLINE") {
    await User.findByIdAndUpdate(id, { status });
  }
  async getUser(viewerId, targetId) {
    const { isFollowing, profileVisibility } =
      await PolicyService.canGuestProfile(viewerId, targetId);

    const user = await User.findById(targetId)
      .select("_id username avatar bio followersCount followingCount")
      .lean();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const pendingRequest = await FriendRequest.findOne({
      sender: viewerId,
      receiver: targetId,
      status: "PENDING",
    })
      .select("_id")
      .lean();

    return {
      ...user,
      isFollowing,
      requestStatus: pendingRequest ? "PENDING" : null,
      pendingRequestId: pendingRequest?._id || null,
    };
  }
  findById(id) {
    return User.findById(id);
  }
  search(str) {
    return User.find({ username: { $regex: str, $options: "i" } });
  }
  async searchInFollowers(viewer, myId, str) {
    await PolicyService.canViewProfile(viewer, myId);
    const regex = new RegExp(str, "i");

    const followers = await Follow.find({ following: myId }).populate({
      path: "follower",
      match: { username: regex },
      select: "username avatar _id",
    });

    return followers.map((f) => f.follower).filter(Boolean);
  }
  async searchInFollowings(myId, str) {
    const regex = new RegExp(str, "i");

    const followings = await Follow.find({ follower: myId }).populate({
      path: "following",
      match: { username: regex },
      select: "username avatar _id",
    });

    return followings.map((f) => f.following).filter(Boolean);
  }
  async toggleBlock(myId, targetId) {
    if (myId.toString() == targetId) {
      throw new SocketConflictException(null, "Cannot access block");
    }
    const exist = await Block.findOne({ blocker: myId, blocked: targetId });
    if (exist) {
      await Block.deleteOne({ _id: exist._id });
      return "unblocked";
    }
    await Block.create({ blocker: myId, blocked: targetId });
    await blockTx(myId, targetId);
    return "blocked";
  }
  findBlockeds(blocker, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return Block.find({ blocker })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }
  searchInBlockeds(blocker, text) {
    const regex = new RegExp(text, "i");
    return Block.find({ blocker }).populate({
      path: "blocked",
      match: { username: regex },
      select: "username avatar _id",
    });
  }
}

module.exports = new UserService();
