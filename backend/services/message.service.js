const mongoose = require("mongoose");
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
const socketService = require("@services/socket.service");
const notificationService = require("@services/notification.service");
const fetchLinkPreview = require("@utilities/link-preview");

class MessageService {
  async getSharedContent(userId, chatId) {
    await PolicyService.canAccessChat(userId, chatId);
    const mediaMessages = await Message.find({
      chat: chatId,
      deletedAt: null,
      type: { $in: ["IMAGE", "MEDIA", "MEDIA_GROUP"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    let media = [];
    mediaMessages.forEach((msg) => {
      if (msg.type === "IMAGE" && msg.image?.url) {
        media.push({
          _id: msg._id,
          url: msg.image.url,
          type: "IMAGE",
          createdAt: msg.createdAt,
        });
      } else if (
        (msg.type === "MEDIA" || msg.type === "MEDIA_GROUP") &&
        msg.media
      ) {
        msg.media.forEach((m) => {
          media.push({
            _id: msg._id,
            url: m.url,
            type: m.mediaType,
            createdAt: msg.createdAt,
          });
        });
      }
    });

    const sharedMessages = await Message.find({
      chat: chatId,
      deletedAt: null,
      type: { $in: ["SHARE_POST", "SHARE_PROFILE", "SHARE_STORY"] }, // Ավելացվել է SHARE_STORY
    })
      .populate([
        { path: "sharedProfile", select: "_id username avatar bio" },
        {
          path: "sharedPost",
          populate: { path: "author", select: "_id username avatar bio" },
        },
        {
          path: "sharedStory",
          populate: { path: "user", select: "_id username avatar bio" },
        },
      ])
      .sort({ createdAt: -1 })
      .lean();

    const linkRegex = /(https?:\/\/[^\s]+)/g;
    const textMessages = await Message.find({
      chat: chatId,
      deletedAt: null,
      type: "TEXT",
    })
      .sort({ createdAt: -1 })
      .lean();

    let links = [];
    textMessages.forEach((msg) => {
      if (msg.text) {
        const matches = msg.text.match(linkRegex);
        if (matches) {
          matches.forEach((url) => {
            links.push({
              _id: msg._id,
              url,
              text: msg.text,
              createdAt: msg.createdAt,
            });
          });
        }
      }
    });

    return { media, shared: sharedMessages, links };
  }

  async getMessages({ userId, chatId, cursor, limit = 20 }) {
    const participant = await participantsService.findOne(userId, chatId);
    if (!participant) {
      throw new ForBiddenException("User is not a participant");
    }

    const query = {
      chat: chatId,
      deletedAt: null,
    };
    if (participant.deletedAt) {
      query.createdAt = { $gt: participant.deletedAt };
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

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate([
        { path: "sender", select: "_id username bio avatar" },
        {
          path: "replyTo",
          populate: { path: "sender", select: "_id username avatar" },
        },
        { path: "sharedProfile", select: "_id username avatar bio" },
        {
          path: "sharedPost",
          populate: { path: "author", select: "_id username avatar bio" },
        },
        {
          path: "sharedStory",
          populate: { path: "user", select: "_id username avatar bio" },
        },
      ])
      .lean();

    const messageIds = messages.map((m) => m._id);
    const reactions = await Reactions.find({
      message: { $in: messageIds },
    }).lean();

    return messages.map((msg) => ({
      ...msg,
      reactions: reactions.filter(
        (r) => r.message.toString() === msg._id.toString(),
      ),
    }));
  }

  async addImage(participantId, chatId, imageFile, text, replyTo = null) {
    const { chat, participant } = await PolicyService.canSendMessage(
      participantId,
      chatId,
    );

    const result = await mediaService.upload(imageFile, "messages");
    const { url, key } = result[0];

    const messagePayload = {
      type: "IMAGE",
      image: { url, key },
    };
    if (text) messagePayload.text = text;
    if (replyTo) messagePayload.replyTo = replyTo;

    const { message } = await sendMessageTx(
      participant.user,
      chatId,
      messagePayload,
    );

    const populatedMessage = await message.populate([
      { path: "sender", select: "_id username avatar bio" },
      {
        path: "replyTo",
        populate: { path: "sender", select: "_id username avatar" },
      },
    ]);

    await socketService.emitReceiveMessage(chatId, {
      ...populatedMessage.toObject(),
      chatId,
    });
    await notificationService.messageNotification({
      fromUser: participant.user,
      messageId: message._id,
      chatId,
    });
    return populatedMessage;
  }

  async addReaction({ participantId, msgId, reaction }) {
    const msg = await Message.findById(msgId);
    if (!msg) throw new NotFoundException("Message not found");

    const participant = await Participants.findOne({
      _id: participantId,
      chatId: msg.chat,
    });
    if (!participant) throw new ConflictException("User is not a member");

    const alreadyReacted = await Reactions.findOne({
      participant: participantId,
      message: msgId,
    });

    let reactionData;
    if (alreadyReacted) {
      alreadyReacted.type = reaction;
      await alreadyReacted.save();
      reactionData = alreadyReacted;
    } else {
      reactionData = await Reactions.create({
        participant: participantId,
        message: msgId,
        type: reaction,
      });
    }

    await socketService.emitReaction(
      msg.chat.toString(),
      msg._id.toString(),
      reactionData,
    );
    return reactionData;
  }

  async removeReaction({ participantId, reactionId }) {
    const reaction = await Reactions.findOne({
      _id: reactionId,
      participant: participantId,
    });
    if (!reaction)
      throw new NotFoundException(
        "Reaction not found or not owned by this user",
      );

    const msgId = reaction.message;
    const msg = await Message.findById(msgId);
    const chatId = msg ? msg.chat : null;

    await reaction.deleteOne();

    if (chatId && msgId) {
      await socketService.emitRemoveReaction(
        chatId.toString(),
        msgId.toString(),
        participantId,
      );
    }
    return true;
  }

  async addMediaGroup(participantId, chatId, files, text, replyTo = null) {
    const { chat, participant } = await PolicyService.canSendMessage(
      participantId,
      chatId,
    );
    const results = await mediaService.upload(files, "messages");

    const media = results.map((res) => ({
      url: res.url,
      key: res.key,
      mediaType: res.url.match(/\.(mp4|webm|ogg)$/i) ? "VIDEO" : "IMAGE",
    }));

    const payload = {
      type: "MEDIA",
      media,
    };

    if (text) payload.text = text;
    if (replyTo) payload.replyTo = replyTo;

    const { message } = await sendMessageTx(participant.user, chatId, payload);
    const populatedMessage = await message.populate([
      { path: "sender", select: "_id username avatar bio" },
      {
        path: "replyTo",
        populate: { path: "sender", select: "_id username avatar" },
      },
    ]);
    await socketService.emitReceiveMessage(chatId, {
      ...populatedMessage.toObject(),
      chatId,
    });
    return populatedMessage;
  }

  async shareContent(participantId, chatId, data) {
    const { chat, participant } = await PolicyService.canSendMessage(
      participantId,
      chatId,
    );

    const payload = { type: data.type, text: data.text };
    if (data.type === "SHARE_PROFILE") payload.sharedProfile = data.sharedId;
    if (data.type === "SHARE_POST") payload.sharedPost = data.sharedId;
    if (data.type === "SHARE_STORY") payload.sharedStory = data.sharedId;

    const { message } = await sendMessageTx(participant.user, chatId, payload);

    const populatedMessage = await Message.findById(message._id)
      .populate([
        { path: "sender", select: "_id username avatar bio" },
        { path: "sharedProfile", select: "_id username avatar bio" },
        {
          path: "sharedPost",
          populate: { path: "author", select: "_id username avatar bio" }, // Ենթադրվում է, որ post-ը ունի 'author' դաշտ
        },
        {
          path: "sharedStory",
          populate: { path: "user", select: "_id username avatar bio" }, // Ենթադրվում է, որ story-ն ունի 'user' դաշտ
        },
      ])
      .lean();

    await socketService.emitReceiveMessage(chatId, {
      ...populatedMessage,
      chatId,
    });
    await notificationService.messageNotification({
      fromUser: participant.user,
      messageId: message._id,
      chatId,
    });
    return populatedMessage;
  }

  async editMessage(userId, messageId, newText) {
    const message = await Message.findById(messageId);
    if (!message) throw new NotFoundException("Message not found");
    if (message.sender.toString() !== userId.toString()) {
      throw new ConflictException("Cannot edit someone else's message");
    }
    if (message.type != "TEXT") {
      throw new BadRequestException(
        "Cannot edit this message as it is not editable",
      );
    }

    message.text = newText;
    message.editedAt = new Date();
    const linkPreview = await fetchLinkPreview(newText);

    if (linkPreview) {
      message.media = [
        {
          mediaType: "LINK",
          url: linkPreview.image || linkPreview.url,
          linkUrl: linkPreview.url,
          title: linkPreview.title,
          description: linkPreview.description,
          key: "LINK",
        },
      ];
    } else if (
      message.media &&
      message.media.some((m) => m.mediaType === "LINK")
    ) {
      message.media = message.media.filter((m) => m.mediaType !== "LINK");
    }

    await message.save();

    await socketService.emitEditMessage(
      message.chat.toString(),
      message._id.toString(),
      newText,
      message.media,
    );
    return message;
  }

  async addMessage(participantId, chatId, text, replyTo = null) {
    const { chat, participant } = await PolicyService.canSendMessage(
      participantId,
      chatId,
    );

    const payload = {
      type: "TEXT",
      text,
    };
    if (replyTo) payload.replyTo = replyTo;
    const linkPreview = await fetchLinkPreview(text);
    if (linkPreview) {
      payload.media = [
        {
          mediaType: "LINK",
          url: linkPreview.image || linkPreview.url,
          key: "LINK",
          linkUrl: linkPreview.url,
          title: linkPreview.title,
          description: linkPreview.description,
        },
      ];
    }
    const { message } = await sendMessageTx(participant.user, chatId, payload);

    const populatedMessage = await message.populate([
      { path: "sender", select: "_id username avatar bio" },
      {
        path: "replyTo",
        populate: { path: "sender", select: "_id username avatar" },
      },
    ]);

    await socketService.emitReceiveMessage(chatId, {
      ...populatedMessage.toObject(),
      chatId,
    });
    await notificationService.messageNotification({
      fromUser: participant.user,
      messageId: message._id,
      chatId,
    });
    return populatedMessage;
  }

  async addVoice(participantId, chatId, voiceFile, replyTo = null) {
    const { chat, participant } = await PolicyService.canSendMessage(
      participantId,
      chatId,
    );

    const result = await mediaService.upload(voiceFile, "audio");
    const { url, key } = result[0];

    const payload = {
      type: "VOICE",
      voice: { url, key },
    };
    if (replyTo) payload.replyTo = replyTo;

    const { message } = await sendMessageTx(participant.user, chatId, payload);

    const populatedMessage = await message.populate([
      { path: "sender", select: "_id username avatar bio" },
      {
        path: "replyTo",
        populate: { path: "sender", select: "_id username avatar" },
      },
    ]);

    await socketService.emitReceiveMessage(chatId, {
      ...populatedMessage.toObject(),
      chatId,
    });
    await notificationService.messageNotification({
      fromUser: participant.user,
      messageId: message._id,
      chatId,
    });
    return populatedMessage;
  }

  async deleteMessage(userId, messageId) {
    const msg = await Message.findById(messageId);
    const chatId = msg ? msg.chat : null;

    const { key } = await deleteMsgTx(userId, messageId);
    if (key) {
      await mediaService.delete([key]);
    }
    if (chatId) {
      await socketService.emitDeleteMessage(
        chatId.toString(),
        messageId.toString(),
      );
    }
  }
}

module.exports = new MessageService();
