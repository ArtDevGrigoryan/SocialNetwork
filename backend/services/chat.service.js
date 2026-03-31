const mongoose = require("mongoose");
const Chat = require("@models/chat");
const Message = require("@models/message");
const startDmTx = require("@transaction/start-dm");
const sendMessageTx = require("@transaction/message");
const readMessagesTx = require("@transaction/read-messages");
const {
  SocketNotFoundException,
  SocketConflictException,
} = require("@helpers/socket-errors");

class ChatService {
  async find(chatId, userId) {
    const chat = await Chat.findOne({
      _id: chatId,
      "participants.user": userId,
    }).populate("participants.user", "_id username avatar");

    if (!chat) throw new SocketNotFoundException("Chat not found");
    return chat;
  }

  startDM(userId, targetId) {
    return startDmTx(userId, targetId);
  }

  addMessage(userId, chatId, text) {
    return sendMessageTx(userId, chatId, { type: "TEXT", text });
  }

  addVoice(userId, chatId, voiceUrl) {
    return sendMessageTx(userId, chatId, { type: "VOICE", voiceUrl });
  }

  async editMessage(userId, messageId, newText) {
    const message = await Message.findById(messageId);
    if (!message) throw new SocketNotFoundException("Message not found");
    if (message.sender.toString() !== userId.toString()) {
      throw new SocketConflictException("Cannot edit someone else's message");
    }
    message.text = newText;
    message.editedAt = new Date();
    await message.save();
    return message;
  }

  async deleteMessage(userId, messageId) {
    const message = await Message.findById(messageId);
    if (!message) throw new SocketNotFoundException("Message not found");
    if (message.sender.toString() !== userId.toString()) {
      throw new SocketConflictException("Cannot delete someone else's message");
    }
    await message.deleteOne();
    return true;
  }

  async read(userId, chatId) {
    return readMessagesTx(userId, chatId);
  }

  async deleteForUser(userId, chatId) {
    const chat = await Chat.findOne({
      _id: chatId,
      "participants.user": userId,
    });
    if (!chat) throw new SocketConflictException("Access denied");
    const participant = chat.participants.find(
      (p) => p.user.toString() === userId.toString(),
    );
    participant.isArchived = true;
    await chat.save();
    return true;
  }
}

module.exports = new ChatService();
