const { sendSuccess } = require("@helpers/api-response");
const messageService = require("@services/message.service");

class MessageController {
  async messages(req, res) {
    const { cursor, limit = 20 } = req.validated.query;
    const { chatId } = req.params;
    const data = { userId: req.user._id.toString(), chatId, cursor, limit };
    const messages = await messageService.getMessages(data);
    return sendSuccess(res, messages);
  }
  async remove(req, res) {
    await messageService.deleteMessage(req.user._id, req.params.id);
    return sendSuccess(res);
  }
  async addReaction(req, res) {
    const { participantId, reaction } = req.body;
    const data = await messageService.addReaction({
      participantId,
      msgId: req.params.id,
      reaction,
    });
    return sendSuccess(res, data);
  }
  async removeReaction(req, res) {
    const { participantId } = req.body;
    await messageService.removeReaction({
      participantId,
      reactionId: req.params.id,
    });
    return sendSuccess(res);
  }
  async editMessage(req, res) {
    const { text } = req.body;
    const updated = await messageService.editMessage(
      req.user._id,
      req.params.id,
      text,
    );
    return sendSuccess(res, updated);
  }
  async addMessage(req, res) {
    const { participantId, text } = req.body;
    const message = await messageService.addMessage(
      participantId,
      req.params.chatId,
      text,
    );
    return sendSuccess(res, message);
  }
  async addVoice(req, res) {
    const { participantId } = req.body;
    const voice = await messageService.addVoice(
      participantId,
      req.params.chatId,
      req.file,
    );
    return sendSuccess(res, voice);
  }
}

module.exports = new MessageController();
