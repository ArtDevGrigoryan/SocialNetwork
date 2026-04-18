const userService = require("@services/user.service");
const { sendSuccess } = require("@helpers/api-response");


class UserController {
  async getUser(req, res) {
    const { id } = req.params;
    const user = await userService.getUser(req.user._id, id);
    return sendSuccess(res, user);
  }
  async getConfig(req, res) {console.log("ՄԱՄԱՅԱՔՈՒՆԱԾ ԷՌՌՈՌ",req.user)
    const config = await userService.getUserConfig(req.user._id);
    return sendSuccess(res, config);
  }
}

module.exports = new UserController();
