const User = require("@models/user");

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
  findById(id) {
    return User.findById(id);
  }
  search(str) {
    return User.find({ username: { $regex: str, $options: "i" } });
  }
  async searchInFollowers(myId, str) {
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
}

module.exports = new UserService();
