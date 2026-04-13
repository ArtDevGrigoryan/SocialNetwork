const Message = require("@models/message");
const Participants = require("@models/participants");
const Reactions = require("@models/reactions");
const PolicyService = require("@services/policy.service");
const deleteMsgTx = require("@transaction/chat/delete-msg");
const sendMessageTx = require("@transaction/chat/message");
const {
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForBiddenException,
} = require("@helpers/errors");
const participantsService = require("./participants.service");
const mediaService = require("../lib/media.service");

class MessageService {
  async getMessages({ userId, chatId, cursor, limit = 20 }) {
    const participant = await participantsService.findOne(userId, chatId);

    if (!participant) {
      throw new ForBiddenException("User is not a participant");
    }

    const date = participant.deletedAt;
    const query = {
      chat: chatId,
      deletedAt: null,
    };

    if (participant.deletedAt) {
      query.createdAt = { $gt: me.deletedAt };
    }

    if (cursor) {
      const [date, id] = cursor.split("_");

      query.$or = [
        { createdAt: { $lt: new Date(date) } },
        {
          createdAt: new Date(date),
          _id: { $lt: new mongoose.Types.ObjectId(id) },
        },
      ];
    }

    return Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("sender", "_id username bio avatar");
  }
  async addReaction({ participantId, msgId, reaction }) {
    const msg = await Message.findById(msgId);
    if (!msg) {
      throw new NotFoundException("Message not found");
    }
    const participant = await Participants.findOne({
      _id: participantId,
      chatId: msg.chat,
    });

    if (!participant) {
      throw new ConflictException("User is not a member");
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
      throw new NotFoundException(
        "Reaction not found or not owned by this user",
      );
    }
    return true;
  }
  async editMessage(userId, messageId, newText) {
    const message = await Message.findById(messageId);
    if (!message) throw new NotFoundException("Message not found");
    if (message.sender.toString() !== userId.toString()) {
      throw new ConflictException("Cannot edit someone else's message");
    }
    if (message.type != "TEXT") {
      throw new BadRequestException(
        "Cannot edit this message but is it not edditable",
      );
    }
    message.text = newText;
    message.editedAt = new Date();
    await message.save();
    return message;
  }
  async addMessage(participantId, chatId, text) {
    const { chat, participant } = await PolicyService.canSendMessage(
      participantId,
      chatId,
    );

    const { message } = await sendMessageTx(participant.user, chatId, {
      type: "TEXT",
      text,
    });

    return await message.populate("sender", "_id username avatar bio");
  }
  async addVoice(participantId, chatId, voiceFile) {
    const { chat, participant, notificationTargets } =
      await PolicyService.canSendMessage(participantId, chatId);

    const result = await mediaService.upload(voiceFile, "audio");
    const { url, key } = result[0];
    const { message } = await sendMessageTx(participant.user, chatId, {
      type: "VOICE",
      voice: {
        url,
        key,
      },
    });

    notificationTargets.forEach((n) => {
      evnetBus.emitEvent("message", {
        user: n.user,
        entity: message._id,
        entityModel: "Message",
      });
    });
    return await message.populate("sender", "_id username avatar bio");
  }
  async deleteMessage(userId, messageId) {
    const { key } = await deleteMsgTx(userId, messageId);
    await mediaService.delete([key]);
  }
}

module.exports = new MessageService();
