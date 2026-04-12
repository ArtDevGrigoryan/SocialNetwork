const { sendSuccess } = require("@helpers/api-response");
const archiveService = require("@services/archive.service");

class ArchiveController {
  async archiveds(req, res) {
    const data = await archiveService.archiveds(
      req.user._id,
      req.validated.query,
    );
    return sendSuccess(res, data);
  }
  async findUnique(req, res) {
    const data = await archiveService.getUnique(req.user._id, req.params.id);
    return sendSuccess(res, data);
  }
  async remove(req, res) {
    await archiveService.remove(req.user._id, req.params.id);
    return sendSuccess(res);
  }
}

module.exports = new ArchiveController();
