const repostService = require("@services/repost.service");
const { sendSuccess } = require("@helpers/api-response");

class RepostController {
  async toggleRepost(req, res) {
    const data = await repostService.toggle(req.user._id, req.params.id);
    return sendSuccess(res, data);
  }
  async myReposts(req, res) {
    const data = await repostService.myReposts(
      req.user._id,
      req.validated.query,
    );
    return sendSuccess(res, data);
  }
  async myPostsReposts(req, res) {
    const data = await repostService.repostsMyPost(
      req.user._id,
      req.validated.query,
    );
    return sendSuccess(res, data);
  }
  async findReposts(req, res) {
    const data = await repostService.findReposts(
      req.user._id,
      req.params.id,
      req.validated.query,
    );
    return sendSuccess(res, data);
  }
}

module.exports = new RepostController();
