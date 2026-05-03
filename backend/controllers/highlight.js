const highlightService = require("@services/highlight.service");
const { sendSuccess } = require("@helpers/api-response");

class HighlightController {
  async create(req, res) {
    const highlight = await highlightService.create(
      req.user._id,
      req.validated.body,
    );
    return sendSuccess(res, highlight, 201);
  }

  async update(req, res) {
    const highlight = await highlightService.update(
      req.user._id,
      req.params.id,
      req.validated.body,
    );
    return sendSuccess(res, highlight, 200, "Highlight updated successfully");
  }

  async getUserHighlights(req, res) {
    const highlights = await highlightService.getUserHighlights(
      req.user._id,
      req.params.userId,
    );
    return sendSuccess(res, highlights);
  }

  async getHighlight(req, res) {
    const highlight = await highlightService.getHighlight(
      req.user._id,
      req.params.id,
    );
    return sendSuccess(res, highlight);
  }

  async remove(req, res) {
    await highlightService.remove(req.user._id, req.params.id);
    return sendSuccess(res, null, 200, "Highlight deleted");
  }
}

module.exports = new HighlightController();
