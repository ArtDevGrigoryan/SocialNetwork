const { sendSuccess } = require("@helpers/api-response");
const saveService = require("@services/save.service");

class SaveController {
  async add(req, res) {
    const { postId } = req.params;
    const save = await saveService.add(req.user._id, postId);
    return sendSuccess(res, save);
  }
  async delete(req, res) {
    const { postId } = req.params;
    await saveService.remove(req.user._id, postId);
    return sendSuccess(res);
  }
  async saves(req, res) {
    const saves = await saveService.saves(req.user._id, req.validated.query);
    return sendSuccess(res, saves);
  }
}

module.exports = new SaveController();
