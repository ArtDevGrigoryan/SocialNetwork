const { sendSuccess } = require("@helpers/api-response");
const commentService = require("@services/comment.service");

class CommentController {
  async add(req, res) {
    const { postId } = req.params;
    const { text } = req.body;

    const comment = await commentService.add(
      req.user._id.toString(),
      postId,
      text,
    );
    return sendSuccess(res, comment);
  }
  async update(req, res) {
    const { id } = req.params;
    const { text } = req.body;
    const comment = await commentService.update(req.user._id, id, text);
    return sendSuccess(res, comment);
  }
  async delete(req, res) {
    const { id } = req.params;
    await commentService.delete(req.user._id, id);
    return sendSuccess(res);
  }
  async comments(req, res) {
    const { postId } = req.params;
    const comments = await commentService.comments(
      req.user._id,
      comments,
      req.validated.query,
    );
    return sendSuccess(res, comments);
  }
  async myComments(req, res) {
    const comments = await commentService.myComments(
      req.user._id,
      req.validated.query,
    );
    return sendSuccess(res, commetns);
  }
}

module.exports = new CommentController();
