const { sendSuccess } = require("@helpers/api-response");
const friendService = require("@services/friend.service");
const userService = require("@services/user.service");

class FriendController {
  async follow(req, res) {
    const message = await friendService.follow(req.user._id, req.params.id);
    return sendSuccess(res, message);
  }
  async unfollow(req, res) {
    const data = await friendService.unfollow(req.user._id, req.params.id);
    return sendSuccess(res, data);
  }
  async accept(req, res) {
    const data = await friendService.accept(req.user._id, req.body.receiver);
    return sendSuccess(res, data);
  }
  async cancel(req, res) {
    const data = await friendService.cancel(req.user._id, req.body.receiver);
    return sendSuccess(res, data);
  }
  async decline(req, res) {
    const data = await friendService.decline(req.user._id, req.body.receiver);
    return sendSuccess(res, data);
  }
  async getFollowers(req, res) {
    const { id } = req.params;
    if ("page" in req.validated.query) {
      const { page, limit } = req.validated.query;
      const data = await friendService.followerList(
        req.user._id,
        id,
        limit,
        page,
      );
      return sendSuccess(res, data);
    }
    const { search } = req.query;
    const founds = await userService.searchInFollowers(
      req.user._id,
      id,
      search,
    );
    return sendSuccess(res, founds);
  }
  async getFollowings(req, res) {
    if ("search" in req.query) {
      const { search } = req.query;
      const founds = await userService.searchInFollowings(req.user.id, search);
      return sendSuccess(res, founds);
    }
    const { page, limit } = req.validated.query;
    const data = await friendService.followingList(
      req.user._id,
      req.params.id,
      limit,
      page,
    );
    return sendSuccess(res, data);
  }
  async search(req, res) {
    const founds = await userService.search(req.query.search);
    return sendSuccess(res, founds);
  }
  async toggleBlock(req, res) {
    const data = await userService.toggleBlock(req.user._id, req.params.userId);
    return sendSuccess(res, data);
  }
  async getBlockeds(req, res) {
    if ("page" in req.validated.query) {
      const { page, limit } = req.validated.query;
      const data = await userService.findBlockeds(req.user._id, page, limit);
      return sendSuccess(res, data);
    }
    const data = await userService.searchInBlockeds(
      req.user._id,
      req.query.text,
    );
    return sendSuccess(res, data);
  }
}

module.exports = new FriendController();
