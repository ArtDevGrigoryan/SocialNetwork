const { sendSuccess } = require("@helpers/api-response");
const likeService = require("@services/like.service");

class LikeController {
  async postLikes(req, res) {
    const { id } = req.params;
    const likes = await likeService.postLikes(
      req.user._id,
      id,
      req.validated.query,
    );
    return sendSuccess(res, likes);
  }
  async myLikes(req, res) {
    const likes = await likeService.myLikes(req.user._id, req.validated.query);
    return sendSuccess(res, likes);
  }
  async search(req, res) {
    const { id } = req.params;
    const { text } = req.query;
    const founds = await likeService.search(req.user._id, id, text);
    return sendSuccess(res, founds);
  }
}

module.exports = new LikeController();
