const { sendSuccess } = require("@helpers/api-response");
const exploreService = require("@services/explore.service");

class ExploreController {
  async posts(req, res) {
    const posts = await exploreService.posts(req.user._id, req.validated.query);
    return sendSuccess(res, posts);
  }
}

module.exports = new ExploreController();
