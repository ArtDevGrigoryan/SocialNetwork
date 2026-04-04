const {
  SocketNotFoundException,
  SocketConflictException,
} = require("@helpers/socket-errors");
const Participants = require("@models/participants");

class ParticipantService {
  async renameParticipant(userId, participantId, name) {
    const participant = await Participants.findById(participantId);
    if (!participant) {
      throw new SocketNotFoundException(null, "Participant not found");
    }
    if (userId.toString() == participantId) {
      participant.name = name;
      await participant.save();
      return participant;
    }
    const renamerParticipant = await Participants.findOne({
      user: userId,
      chatId: participant.chatId,
    });
    if (!renamerParticipant) {
      throw new SocketConflictException(null, "Is not a member in this chat");
    }
    participant.name = name;
    await participant.save();
    return participant;
  }
  async mute(userId, chatId) {
    const participant = await Participants.findOneAndUpdate(
      { user: userId, chatId },
      { isMuted: true },
      { new: true },
    );
    if (!participant) {
      throw new SocketNotFoundException(
        null,
        "User is not a member in this chat",
      );
    }
    return participant;
  }
  async unMute(userId, chatId) {
    const participant = await Participants.findOneAndUpdate(
      { user: userId, chatId },
      { isMuted: false },
      { new: true },
    );
    if (!participant) {
      throw new SocketNotFoundException(
        null,
        "User is not a member in this chat",
      );
    }
    return participant;
  }
  async findOne(user, chatId) {
    return await Participants.findOne({ user, chatId });
  }
  async deleteForUser(userId, chatId) {
    const participant = await Participants.findOne({ user: userId, chatId });

    participant.isArchived = true;
    participant.deletedAt = new Date();

    await participant.save();
    return true;
  }
}

module.exports = new ParticipantService();
