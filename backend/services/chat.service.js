const Chat = require("@models/chat");

class ChatService {
  async find(id) {
    const chat = await Chat.findById(id).populate("users");
    if (!chat) {
      throw new Error();
    }
    return chat;
  }
}

module.exports = new ChatService();
