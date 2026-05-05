const { sendSuccess } = require("@helpers/api-response");
const storyService = require("@services/story.service");

class StoryController {
  async getViewers(req, res) {
    return sendSuccess(
      res,
      await storyService.getStoryViewers(req.user._id, req.params.id),
    );
  }
  async stories(req, res) {
    return sendSuccess(
      res,
      await storyService.stories(req.user._id, req.validated?.query),
    );
  }
  async uniqueStory(req, res) {
    return sendSuccess(
      res,
      await storyService.uniqueStory(req.user._id, req.params.id),
    );
  }
  async profileStories(req, res) {
    return sendSuccess(
      res,
      await storyService.guestStories(req.user._id, req.params.id),
    );
  }
  async add(req, res) {
    return sendSuccess(
      res,
      await storyService.add(req.user._id, req.body, req.file),
    );
  }
  async remove(req, res) {
    await storyService.remove(req.user, req.params.id);
    return sendSuccess(res);
  }
  async reaction(req, res) {
    await storyService.reaction(req.user._id, req.params.id, req.body.reaction);
    return sendSuccess(res);
  }
  async like(req, res) {
    await storyService.like(req.user._id, req.params.id);
    return sendSuccess(res);
  }
}
module.exports = new StoryController();
