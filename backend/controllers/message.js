const { sendSuccess } = require("@helpers/api-response");
const messageService = require("@services/message.service");

class MessageController {
  async sharedContent(req, res) {
    const data = await messageService.getSharedContent(
      req.user._id,
      req.params.id,
    );
    return sendSuccess(res, data);
  }
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
    const { participantId, text, replyTo } = req.body;
    const message = await messageService.addMessage(
      participantId,
      req.params.chatId,
      text,
      replyTo,
    );
    return sendSuccess(res, message);
  }
  async addVoice(req, res) {
    const { participantId, replyTo } = req.body;
    const voice = await messageService.addVoice(
      participantId,
      req.params.chatId,
      req.file,
      replyTo,
    );
    return sendSuccess(res, voice);
  }
  async addMediaGroup(req, res) {
    const { participantId, text, replyTo } = req.body;
    const message = await messageService.addMediaGroup(
      participantId,
      req.params.chatId,
      req.files,
      text,
      replyTo,
    );
    return sendSuccess(res, message);
  }

  async shareContent(req, res) {
    const { participantId, type, sharedId, text } = req.body;
    const message = await messageService.shareContent(
      participantId,
      req.params.chatId,
      { type, sharedId, text },
    );
    return sendSuccess(res, message);
  }
  async addImage(req, res) {
    const { participantId, text, replyTo } = req.body;
    const image = await messageService.addImage(
      participantId,
      req.params.chatId,
      req.file,
      text,
      replyTo,
    );
    return sendSuccess(res, image);
  }
}

module.exports = new MessageController();
