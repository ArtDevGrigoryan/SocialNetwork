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
}

module.exports = new UserService();
