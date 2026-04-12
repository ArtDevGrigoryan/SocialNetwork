const mongoose = require("mongoose");
const Block = require("@models/blocked-user");
const Setting = require("@models/setting");
const Post = require("@models/post");
const Chat = require("@models/chat");
const Like = require("@models/like");
const Participant = require("@models/participants");
const Follow = require("@models/follow");
const FriendRequest = require("@models/friend-request");
const Message = require("@models/message");
const User = require("@models/user");
const {
  NotFoundException,
  ForBiddenException,
  ConflictException,
} = require("@helpers/errors");

class PolicyService {
  static withSession(query, session) {
    return session ? query.session(session) : query;
  }
  static existUsers(userIds) {
    return this.withSession(
      User.find({ _id: { $in: userIds } }).select("_id"),
    ).lean();
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
  // Post
  static async isPostAuthor(userId, postId, session = null) {
    const exist = await this.withSession(
      Post.exists({ author: userId, _id: postId }),
      session,
    );
    return !!exist;
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
  static async canAccessRepost(reposterId, postId, session = null) {
    const post = await this.canAccessPost(reposterId, postId, session);
    if (!post.accessRepost) {
      throw new ForBiddenException("Cannot access repost");
    }
    return post;
  }
  static async canModifyPost(userId, postId, session = null) {
    const post = await this.withSession(Post.findById(postId), session);
    if (!post) throw new NotFoundException("Post not found");
    if (userId.toString() !== post.author.toString()) {
      throw new ConflictException("Cannot modify this post");
    }
    return post;
  }
  // Chat
  static async canAccessChat(userId, chatId, session = null) {
    const [result] = await Participant.aggregate([
      {
        $match: { chatId: new mongoose.Types.ObjectId(chatId) },
      },
      {
        $facet: {
          me: [{ $match: { user: new mongoose.Types.ObjectId(userId) } }],
          others: [
            { $match: { user: { $ne: new mongoose.Types.ObjectId(userId) } } },
          ],
        },
      },
    ]).session(session);

    const me = result.me[0] || null;
    const others = result.others;

    if (!me) {
      throw new ForBiddenException("Cannot access chat");
    }
    if (others.length == 1) {
      const isBlocked = await this.isBlocked(userId, others[0].user);
      if (isBlocked) {
        throw new NotFoundException("Chat not found");
      }
    }
    return me;
  }
  static async isMember(participantId, chatId, session = null) {
    const exist = await Participant.exists({
      _id: participantId,
      chatId,
    }).lean();
    return !!exist;
  }
  static async isChatMessage(msgId, chatId, session = null) {
    const msg = await this.withSession(
      Message.findOne({ _id: msgId, chat: chatId }),
      session,
    ).lean();
    return msg;
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
    return { admin, removed: participant };
  }
  static async canDisjoinChat(participantId, chatId, session = null) {
    const [participant, chat] = await Promise.all([
      this.withSession(Participant.findById(participantId), session),
      this.withSession(Chat.findOne({ _id: chatId, type: "group" }), session),
    ]);
    if (!participant) {
      throw new NotFoundException("Participan not found");
    }
    if (!chat) {
      throw new ForBiddenException("Cannot disjoin this chat");
    }

    return participant.user;
  }
  static async canSendMessage(participantId, chatId, session = null) {
    const [chat, participant] = await Promise.all([
      this.withSession(Chat.findById(chatId), session).lean(),
      this.withSession(
        Participant.findOne({ chatId, _id: participantId, deletedAt: null }),
        session,
      ).lean(),
    ]);

    if (!chat) throw new NotFoundException("Chat not found");
    if (!participant) throw new ConflictException("Not a member of this chat");

    return { chat, participant };
  }
  static async canReadMessages(userId, chatId, session = null) {
    const participant = await this.withSession(
      Participant.findOne({ user: userId, chatId, deletedAt: null }),
      session,
    );
    if (!participant)
      throw new ConflictException("User is not a member of this chat");
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

    if (!chat) throw new NotFoundException("Chat not found");
    if (chat.type !== "group")
      throw new BadRequestException("Cannot manage DM");
    if (!admin)
      throw new ConflictException("Only admins can manage this group");

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
      throw new ConflictException("Participant not found in this chat");
    return { chat, target };
  }

  // Message

  static async canAccessMessage(userId, msgId, session = null) {
    const message = await this.withSession(
      Message.findOne({
        _id: msgId,
        deletedAt: null,
      }),
      session,
    ).lean();
    if (!message) {
      throw new NotFoundException("Message not found");
    }
    if (message.sender.toString() != userId) {
      const admin = await this.withSession(
        Participant.findOne({
          user: userId,
          chatId: message.chat,
          role: "admin",
        }),
        session,
      );
      if (!admin) {
        throw new ForBiddenException("Cannot access this message");
      }
    }
    return message;
  }

  // FriendShip
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
  static async canInitiateFollow(senderId, receiverId, session = null) {
    if (senderId.toString() === receiverId.toString()) {
      throw new ConflictException("Cannot follow yourself");
    }
    if (await this.isBlocked(senderId, receiverId, session)) {
      throw new ConflictException("Blocked");
    }

    const existing = await this.withSession(
      FriendRequest.findOne({
        sender: senderId,
        receiver: receiverId,
      }),
      session,
    );

    if (existing && existing.status != "DECLINED") {
      throw new ConflictException("Already followed or request exists");
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

    return request.sender;
  }
}

module.exports = PolicyService;
