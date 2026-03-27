const { SocketNotFoundException } = require("@helpers/socket-errors");
const userService = require("@services/user.service");
const Chat = require("@models/chat");

class ChatService {
  async find(id) {
    const chat = await Chat.findById(id).populate("users");
    if (!chat) {
      throw new Error();
    }
    return chat;
  }
  async create(user1, user2) {
    const { missing } = userService.checkExists(user1, user2);
    if (missing.length) {
      throw new SocketNotFoundException(null, `${missing.join(",")}`);
    }
    const chat = await Chat.create({
      users: [user1, user2],
    });
    return chat;
  }
}

module.exports = new ChatService();
