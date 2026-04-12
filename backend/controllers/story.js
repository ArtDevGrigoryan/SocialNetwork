const { sendSuccess } = require("@helpers/api-response");
const storyService = require("@services/story.service");

class StoryController {
  async stories(req, res) {
    const stories = await storyService.stories(
      req.user._id,
      req.validated?.query,
    );
    return sendSuccess(res, stories);
  }
  async uniqueStory(req, res) {
    const story = await storyService.uniqueStory(req.user._id, req.params.id);
    return sendSuccess(res, story);
  }
  async profileStories(req, res) {
    const stories = await storyService.guestStories(
      req.user._id,
      req.params.id,
    );
    return sendSuccess(res, stories);
  }
  async add(req, res) {
    const story = await storyService.add(req.user._id, req.body, req.file);
    return sendSuccess(res, story);
  }
  async remove(req, res) {
    await storyService.remove(req.user, req.params.id);
  }
}

module.exports = new StoryController();
