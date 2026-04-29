const { sendSuccess } = require("@helpers/api-response");
const chatService = require("@services/chat.service");

class ChatController {
  async specificChat(req, res) {
    const chat = await chatService.find(req.user._id, req.params.id);
    return sendSuccess(res, chat);
  }
  async chats(req, res) {
    const isSearch = "text" in req.query;
    const chats = isSearch
      ? await chatService.searchChat(req.user._id, req.query.text)
      : await chatService.getChats(req.user._id, req.validated.query);
    return sendSuccess(res, chats);
  }
  async myChats(req, res) {
    const chats = await chatService.myChats(req.user._id);
    return sendSuccess(res, chats);
  }
  async createDM(req, res) {
    const { userId } = req.body;
    const chat = await chatService.createDM(req.user._id, userId);
    return sendSuccess(res, chat);
  }
  async createGroup(req, res) {
    const chat = await chatService.createGroup(req.user._id, req.body);
    return sendSuccess(res, chat);
  }
  async addMembers(req, res) {
    const { userIds } = req.body;
    const addedParticipants = await chatService.addMembers(
      req.user._id,
      req.params.id,
      userIds,
    );
    return sendSuccess(res, addedParticipants);
  }

  async updateParticipant(req, res) {
    const { id, participantId } = req.params;
    const updated = await chatService.updateParticipant(
      req.user._id,
      id,
      participantId,
      req.body,
    );
    return sendSuccess(res, updated);
  }

  async admins(req, res) {
    const admins = await chatService.getAdmins(req.user._id, req.params.id);
    return sendSuccess(res, admins);
  }
  async togglePinMsg(req, res) {
    const { participantId, messageId } = req.body;
    const chat = await chatService.togglePinMsg(
      participantId,
      req.params.id,
      messageId,
    );
    return sendSuccess(res, chat);
  }
  async readMsg(req, res) {
    await chatService.read(req.user._id, req.params.id);
    return sendSuccess(res);
  }
  async removeGroup(req, res) {
    await chatService.deleteGroup(req.user._id, req.params.id);
    return sendSuccess(res);
  }
  async removeMember(req, res) {
    const { participantId, removerId } = req.body;
    const { id } = req.params;
    await chatService.removeUserFromGruop(removerId, id, participantId);
    return sendSuccess(res);
  }
  async disjoin(req, res) {
    const { participantId } = req.body;
    await chatService.disjoinChat(participantId, req.params.id);
    return sendSuccess(res);
  }
  async update(req, res) {
    const updated = await chatService.updateGroup(
      req.user._id,
      req.params.id,
      req.body,
    );
    return sendSuccess(res, updated);
  }
  async getByKey(req, res) {
    const chat = await chatService.getByKey(req.query.key);
    return sendSuccess(res, chat);
  }
}

module.exports = new ChatController();
