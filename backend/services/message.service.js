const Message = require("@models/message");

class MessageService {
  async getMessages(chatId, cursor, limit = 20) {
    const query = { chat: chatId };

    if (cursor) {
      query.createdAt = { $lt: cursor };
    }

    return Message.find(query).sort({ createdAt: -1 }).limit(limit);
  }

  async getById(messageId) {
    return Message.findById(messageId);
  }
}

module.exports = new MessageService();
