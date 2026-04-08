// ./services/policy.service.js
const mongoose = require("mongoose");
const Block = require("@models/blocked-user");
const Setting = require("@models/setting");
const Post = require("@models/post");
const Chat = require("@models/chat");
const Like = require("@models/like");
const Participant = require("@models/participants");
const Follow = require("@models/follow");
const FriendRequest = require("@models/friend-request");

const {
  SocketNotFoundException,
  SocketConflictException,
  SocketBadRequestException,
} = require("@helpers/socket-errors");
const { NotFoundException, ForBiddenException } = require("@helpers/errors");

class PolicyService {
  static withSession(query, session) {
    return session ? query.session(session) : query;
  }

  static async isBlocked(userId, targetId, session = null) {
    if (!userId || !targetId || userId.toString() === targetId.toString())
      return false;

    const block = await this.withSession(
      Block.findOne({
        $or: [
          { blocker: userId, blocked: targetId },
          { blocker: targetId, blocked: userId },
        ],
      }),
      session,
    );
    return !!block;
  }
  static async isPostAuthor(userId, postId, session = null) {
    const exist = await this.withSession(
      Post.exists({ author: userId, _id: postId }),
      session,
    );
    return !!exist;
  }
  static async canViewProfile(viewerId, targetId, session = null) {
    if (viewerId.toString() === targetId.toString())
      return { isFollowing: true, profileVisibility: "" };

    if (await this.isBlocked(viewerId, targetId, session)) {
      throw new NotFoundException("User not found");
    }

    const setting = await this.withSession(
      Setting.findOne({ user: targetId }).select("privacy.profileVisibility"),
      session,
    );

    if (setting?.privacy?.profileVisibility === "PRIVATE") {
      const follow = await this.withSession(
        Follow.findOne({ follower: viewerId, following: targetId }),
        session,
      );
      if (!follow) throw new NotFoundException("User not found");
      return { isFollowing: true, profileVisibility: "PRIVATE" };
    }
    return { profileVisibility: "PUBLIC", isFollowing: null };
  }

  static async canAccessPost(viewerId, postId, session = null) {
    const post = await this.withSession(
      Post.findById(postId).populate("author", "_id username avatar bio"),
      session,
    );

    if (!post) throw new NotFoundException("Post not found");
    const authorId = post.author._id.toString();

    if (viewerId != authorId) {
      await this.canViewProfile(viewerId, authorId, session);
    }

    const [isLiked, isFollowing] = await Promise.all([
      this.withSession(
        Like.exists({
          user: viewerId,
          post: postId,
        }),
        session,
      ),

      this.withSession(
        Follow.exists({
          follower: viewerId,
          following: authorId,
        }),
        session,
      ),
    ]);

    return {
      ...post.toObject(),
      viewer: {
        isLiked: !!isLiked,
        isFollowing: !!isFollowing,
      },
    };
  }
  static async canModifyPost(userId, postId, session = null) {
    const post = await this.withSession(Post.findById(postId), session);
    if (!post) throw new NotFoundException("Post not found");
    if (userId.toString() !== post.author.toString()) {
      throw new SocketConflictException(null, "Cannot modify this post");
    }
    return post;
  }
  static async participantsSettings(userId, chatId, session = null) {
    return await Participant.aggregate([
      { $match: { chatId, user: { $ne: userId } } },
      {
        $lookup: {
          from: "settings",
          localField: "user",
          foreignField: "user",
          as: "setting",
        },
      },
      {
        $addFields: {
          settings: { $arrayElemAt: ["$setting", 0] },
        },
      },
      {
        $project: {
          user: 1,
          role: 1,
          isMuted: 1,
          participantName: 1,
          lastReadMessage: 1,
          unreadCount: 1,
          notificationSettings: "$settings.notifications",
        },
      },
    ]).session(session);
  }
  static async canRemoveGroup(userId, chatId, session = null) {
    const [admin, chat] = await Promise.all([
      Participant.findOne({ user: userId, chatId, role: "admin" }).session(
        session,
      ),
      Chat.findById(chatId).session(session),
    ]);
    if (!admin || chat.type == "dm") {
      throw new ForBiddenException("Cannot access delete this group");
    }
    const participantsWithSettings = await this.participantsSettings(
      userId,
      chatId,
      session,
    );
    return participantsWithSettings
      .filter((p) => !p.isMuted && p.notificationSettings.group_removed)
      .map((p) => p.user);
  }
  static async canRemoveMember(
    removerParticipantId,
    chatId,
    participantId,
    session = null,
  ) {
    const [admin, chat, participant] = await Promise.all([
      Participant.findOne({
        _id: removerParticipantId,
        chatId,
        role: "admin",
      }).session(session),
      Chat.findById(chatId).session(session),
      Participant.findOne({ _id: participantId, chatId }).session(session),
    ]);
    if (!admin || !participant || chat.type == "dm") {
      throw new ForBiddenException("Cannot access or delete this participant");
    }
    const participantsWithSettings = await this.participantsSettings(
      userId,
      chatId,
      session,
    );
    let removed = null;
    const filtered = participantsWithSettings.filter((p, i) => {
      let res = p._id.toString() != participantId;
      if (res) {
        removed = p;
      }
      return res;
    });
    const notifyRemoved = removed
      ? !removed.isMuted && removed.notificationSettings.group_member_removed
      : false;
    return {
      removedNotif: notifyRemoved ? removed.user : null,
      removedUser: removed.user,
      notifs: filtered
        .filter(
          (p) =>
            !p.isMuted && p.notificationSettings.group_member_removed_notice,
        )
        .map((p) => p.user),
    };
  }
  static async canDisjoinChat(participantId, chatId, session = null) {
    const [participant, chat] = await Promise.all([
      this.withSession(Participant.findById(participantId), session),
      this.withSession(Chat.findOne({ _id: chatId, type: "dm" }), session),
    ]);
    if (!participant) {
      throw new NotFoundException("Participan not found");
    }
    if (!chat) {
      throw new ForBiddenException("Cannot disjoin this chat");
    }
    const participantsWithSettings = await this.participantsSettings(
      participant.user,
      chatId,
      session,
    );
    return {
      participantsWithSettings: participantsWithSettings.filter(
        (p) => !p.isMuted && p.notificationSettings.group_member_removed_notice,
      ),
      user: participant.user,
    };
  }
  static async canSendMessage(userId, chatId, session = null) {
    const [chat, participant] = await Promise.all([
      this.withSession(Chat.findById(chatId), session),
      this.withSession(
        Participant.findOne({ chatId, user: userId, deletedAt: null }),
        session,
      ),
    ]);

    if (!chat) throw new SocketNotFoundException(null, "Chat not found");
    if (!participant)
      throw new SocketConflictException(null, "Not a member of this chat");

    const participantsWihtSettings = await this.participantsSettings(
      userId,
      chatId,
      session,
    );
    const notificationTargets = [];

    if (chat.type === "dm") {
      const other = participantsWihtSettings[0];
      if (!other)
        throw new SocketConflictException(null, "No other participant found");

      const block = await this.isBlocked(userId, other.user);
      if (block) {
        throw new SocketNotFoundException(null, "Not found");
      }
      if (other.notificationSettings?.message && !other.isMuted)
        notificationTargets.push(other.user);
    } else {
      notificationTargets.push(
        ...participantsWihtSettings
          .filter((p) => !p.isMuted && p.notificationSettings.message)
          .map((p) => p.user),
      );
    }
    return { chat, participant, notificationTargets };
  }

  static async canReadMessages(userId, chatId, session = null) {
    const participant = await this.withSession(
      Participant.findOne({ user: userId, chatId, deletedAt: null }),
      session,
    );
    if (!participant)
      throw new SocketConflictException(
        null,
        "User is not a member of this chat",
      );
    return participant;
  }

  static async canManageGroup(userId, chatId, session = null) {
    const [chat, admin] = await Promise.all([
      this.withSession(Chat.findById(chatId), session),
      this.withSession(
        Participant.findOne({ chatId, user: userId, role: "admin" }),
        session,
      ),
    ]);

    if (!chat) throw new SocketNotFoundException(null, "Chat not found");
    if (chat.type !== "group")
      throw new SocketBadRequestException(null, "Cannot manage DM");
    if (!admin)
      throw new SocketConflictException(
        null,
        "Only admins can manage this group",
      );

    return { chat, admin };
  }

  static async canRemoveParticipant(
    adminId,
    chatId,
    participantId,
    session = null,
  ) {
    const { chat } = await this.canManageGroup(adminId, chatId, session);
    const target = await this.withSession(
      Participant.findOne({ _id: participantId, chatId }),
      session,
    );
    if (!target)
      throw new SocketConflictException(
        null,
        "Participant not found in this chat",
      );
    return { chat, target };
  }
  // FriendShip
  static async canInitiateFollow(senderId, receiverId, session = null) {
    if (senderId.toString() === receiverId.toString()) {
      throw new SocketConflictException(null, "Cannot follow yourself");
    }
    if (await this.isBlocked(senderId, receiverId, session)) {
      throw new SocketConflictException(null, "Blocked");
    }

    const existing = await this.withSession(
      FriendRequest.findOne({
        sender: senderId,
        receiver: receiverId,
      }),
      session,
    );

    if (existing && existing.status != "DECLINED") {
      throw new SocketConflictException(
        null,
        "Already followed or request exists",
      );
    }
    const setting = await this.withSession(
      Setting.findOne({ user: receiverId }),
      session,
    ).lean();
    return {
      profileVisibility: setting.privacy.profileVisibility,
      notificationSettings: setting.notifications,
    };
  }
  static async canInitiateUnfollow(senderId, receiverId, session = null) {
    const request = await this.withSession(
      FriendRequest.findOne({
        sender: senderId,
        receiver: receiverId,
        status: "ACCEPTED",
      }),
      session,
    ).lean();
    if (!request) {
      throw new NotFoundException("Follow not found");
    }
    const setting = await this.withSession(
      Setting.findOne({ user: receiverId }),
      session,
    ).lean();
    return { notificationSettings: setting.notifications };
  }
  static async canRequestReaction(receiver, requestId, session = null) {
    const request = await this.withSession(
      FriendRequest.findOne({
        _id: requestId,
        receiver,
        status: "PENDING",
      }),
      session,
    ).lean();
    if (!request) {
      throw new NotFoundException("Request not found");
    }
    const block = await this.isBlocked(receiver, request.sender, session);
    if (block) {
      throw new NotFoundException("Request not found");
    }
    const setting = await this.withSession(
      Setting.findOne({ user: request.sender }),
      session,
    ).lean();
    return {
      notificationSettings: setting.notifications,
      sender: request.sender,
    };
  }
}

module.exports = PolicyService;
