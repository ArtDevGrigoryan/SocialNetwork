const userService = require("@services/user.service");
const { sendSuccess } = require("@helpers/api-response");


class UserController {
  async getUser(req, res) {
    const { id } = req.params;
    const user = await userService.getUser(req.user._id, id);
    return sendSuccess(res, user);
  }
}

module.exports = new UserController();
