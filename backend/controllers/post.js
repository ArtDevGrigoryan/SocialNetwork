const { sendSuccess } = require("@helpers/api-response");
const postService = require("@services/post.service");

class PostController {
  async create(req, res) {
    const { files } = req;
    const { content } = req.body;
    const post = await postService.create(req.user._id, files, content);
    return sendSuccess(res, post);
  }
  async update(req, res) {
    const { id } = req.params;
    const data = {
      files: req.files,
      content: req.body.content,
    };
    const post = await postService.update(req.user._id, id, data);
    return sendSuccess(res, post);
  }
  async toggleArchive(req, res) {
    const post = await postService.toggleArchivePost(
      req.user._id,
      req.params.id,
    );
    return sendSuccess(res, post);
  }
  async getPosts(req, res) {
    const { limit, page, author } = req.validated.query;
    const posts = await postService.getPosts(req.user._id, author, page, limit);
    return sendSuccess(res, posts);
  }
  async getArchived(req, res) {
    const { limit, page } = req.validated.query;
    const archivedPosts = await postService.getArchivedPosts(
      req.user._id,
      page,
      limit,
    );
    return sendSuccess(res, archivedPosts);
  }
  async getSpecific(req, res) {
    const { id } = req.params;
    const post = await postService.getSpecific(req.user._id, id);
    return sendSuccess(res, post);
  }
  async delete(req, res) {
    await postService.deletePost(req.user, req.params.id);
    return sendSuccess(res, null);
  }
  async removeImage(req, res) {
    const { id } = req.params;
    const { url } = req.body;
    const updated = await postService.removeImage(req.user._id, id, url);
    return sendSuccess(res, updated);
  }
  async toggleLike(req, res) {
    const { id } = req.params;
    const updated = await postService.toggleLike(req.user._id, id);
    return sendSuccess(res, updated);
  }
  async toggleAccessRepost(req, res) {
    const { id } = req.params;
    const updated = await postService.toggleAccessRepost(req.user._id, id);
    return sendSuccess(res, updated);
  }
}

module.exports = new PostController();
