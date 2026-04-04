const Message = require("@models/message");
const {
  SocketNotFoundException,
  SocketConflictException,
} = require("@helpers/socket-errors/");
const Participants = require("@models/participants");
const Reactions = require("@models/reactions");

class MessageService {
  async getMessages({ participant, userId, cursor, limit = 20 }) {
    const query = {
      chat: chat._id,
      deletedAt: null,
    };

    if (participant.deletedAt) {
      query.createdAt = { $gt: me.deletedAt };
    }

    if (cursor) {
      query.createdAt = {
        ...query.createdAt,
        $lt: new Date(cursor),
      };
    }

    return Message.find(query).sort({ createdAt: -1 }).limit(limit);
  }
  async deleteForEveryone(messageId, userId) {
    const msg = await Message.findOne({
      _id: messageId,
      sender: userId,
    });

    if (!msg) throw new SocketNotFoundException(null, "Message not found");

    msg.text = "Message deleted";
    msg.voiceUrl = null;
    msg.type = "TEXT";
    msg.deletedAt = new Date();

    await msg.save();

    const lastMessage = await Message.findOne({
      chat: msg.chat,
      deletedAt: null,
    }).sort({ createdAt: -1 });

    await Chat.updateOne(
      { _id: msg.chat },
      { lastMessage: lastMessage?._id || null },
    );

    return msg;
  }
  async addReaction({ participantId, msgId, reaction }) {
    const [participant, msg] = await Promise.all([
      Participants.findById(participantId),
      Message.findById(msgId),
    ]);
    if (!participant) {
      throw new SocketConflictException(null, "User is not a member");
    }
    if (!msg) {
      throw new SocketNotFoundException(null, "Message not found");
    }
    const alreadyReacted = await Reactions.findOne({
      participant: participantId,
      message: msgId,
    });
    if (alreadyReacted) {
      alreadyReacted.type = reaction;
      await alreadyReacted.save();
      return alreadyReacted;
    }
    return await Reactions.create({
      participant: participantId,
      message: msgId,
      type: reaction,
    });
  }
  async removeReaction({ participantId, reactionId }) {
    const reaction = await Reactions.findOneAndDelete({
      _id: reactionId,
      participant: participantId,
    });
    if (!reaction) {
      throw new SocketNotFoundException(
        null,
        "Reaction not found or not owned by this user",
      );
    }
    return true;
  }
}

module.exports = new MessageService();
