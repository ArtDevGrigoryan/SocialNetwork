// ==========================================
// FILE: src/types/api.types.ts
// ==========================================

// =======================
// 1. BASE API TYPES
// =======================
export interface IResponse<T> {
  success: boolean;
  message: string;
  payload: T;
  error?: string | null;
}

export interface IPaginationQuery {
  page?: number;
  limit?: number;
  cursor?: string;
}

// =======================
// 2. ENUMS & LITERALS
// =======================
export type UserRole = "admin" | "user";
export type UserStatus = "ONLINE" | "OFFLINE";
export type ChatType = "dm" | "group";
export type ParticipantRole = "member" | "admin";
export type RequestStatus = "ACCEPTED" | "DECLINED" | "PENDING";
export type ProfileVisibility = "PUBLIC" | "PRIVATE";

export type MessageTypeEnum =
  | "TEXT"
  | "VOICE"
  | "IMAGE"
  | "MEDIA"
  | "MEDIA_GROUP"
  | "SHARE_POST"
  | "SHARE_PROFILE"
  | "SHARE_STORY";

export type MediaTypeEnum = "IMAGE" | "VIDEO" | "LINK";

export type NotificationTypeEnum =
  | "LIKE"
  | "FOLLOW"
  | "REQUEST"
  | "DECLINED"
  | "ACCEPTED"
  | "COMMENT"
  | "MESSAGE"
  | "NEW_GROUP"
  | "GROUP_REMOVED"
  | "GROUP_DISJOIN"
  | "PARTICIPANT_REMOVED"
  | "PARTICIPANT_REMOVED_NOTICE"
  | "NEW_POST"
  | "NEW_STORY"
  | "CANCELLED"
  | "SYSTEM"
  | "UNFOLLOW"
  | "MENTION";

export type EntityModelEnum =
  | "User"
  | "Posts"
  | "Comments"
  | "Message"
  | "Chat"
  | "Story";

// =======================
// 3. CORE ENTITIES (MODELS)
// =======================

export interface IUser {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  website?: string;
  followersCount: number;
  followingCount: number;
  status: UserStatus;
  role: UserRole;
  deactived: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  // Dynamic fields from aggregations
  isFollowing?: boolean;
  requestStatus?: RequestStatus | null;
  pendingRequestId?: string | null;
  twoFactorEnabled?: boolean;
  mutualCount?: number; // From suggestions
}

export interface ISetting {
  _id: string;
  user: string | IUser;
  notifications: {
    accept_request: boolean;
    decline_request: boolean;
    cancel_request: boolean;
    follow_request: boolean;
    follow: boolean;
    unfollow: boolean;
    group_member_removed: boolean;
    group_removed: boolean;
    group_member_removed_notice: boolean;
    message: boolean;
    like: boolean;
    new_group: boolean;
    new_post: boolean;
    new_story: boolean;
    comment: boolean;
  };
  privacy: {
    profileVisibility: ProfileVisibility;
    showLastSeen: boolean;
    showTyping: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IPostImage {
  url: string;
  key: string;
  filter: string;
}

export interface IPostMusic {
  url: string;
  title: string;
  startTime: number;
}

export interface IPost {
  _id: string;
  author: IUser;
  content?: string;
  images: IPostImage[];
  location?: string;
  mentions?: IUser[];
  music?: IPostMusic;
  likes: number;
  comments: number;
  isArchived: boolean;
  accessRepost: boolean;
  createdAt: string;
  updatedAt: string;

  // Aggregation fields
  isLiked?: boolean;
  isSaved?: boolean;
  isReposted?: boolean;
  likesCount?: number;
  commentsCount?: number;
  viewer?: {
    isLiked: boolean;
    isSaved: boolean;
  };
}

export interface IComment {
  _id: string;
  post: string | IPost;
  author: IUser;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface IStoryMedia {
  url: string;
  key: string;
  type: "image" | "video";
  musicUrl?: string;
  musicTitle?: string;
  musicStartTime?: number;
  musicDuration?: number;
  filter?: string;
  location?: {
    name: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
  } | null;
  transform?: { scale: number; x: number; y: number };
  stickers?: Array<{
    emoji: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
  }>;
  texts?: Array<{
    content: string;
    color: string;
    fontFamily: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
  }>;
  duration?: number;
  thumbnail?: string;
}

export interface IStory {
  _id: string;
  user: IUser;
  media: IStoryMedia;
  viewsCount: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  // Aggregation fields
  viewer?: {
    seen: boolean;
    liked: boolean;
    reaction?: string | null;
  };
}

export interface IArchiveReaction {
  viewer: IUser;
  reaction?: string;
  viewedAt: string;
}

export interface IStoryArchive {
  _id: string;
  originalStoryId: string;
  user: string | IUser;
  media: IStoryMedia;
  viewsCount: number;
  createdAt: string;
  expiresAt: string;
  archivedAt: string;
  isManualDelete: boolean;
  reactions: IArchiveReaction[];
}

export interface IHighlight {
  _id: string;
  user: string | IUser;
  title: string;
  cover: string;
  archives: IStoryArchive[];
  createdAt: string;
  updatedAt: string;
}

export interface IMessageMedia {
  url: string;
  key: string;
  mediaType: MediaTypeEnum;
  linkUrl?: string;
  title?: string;
  description?: string;
}

export interface IReaction {
  _id: string;
  message: string;
  participant: string | IParticipant;
  type: string;
  createdAt: string;
}

export interface IMessage {
  _id: string;
  chat: string | IChat;
  sender: IUser;
  type: MessageTypeEnum;
  text?: string;
  replyTo?: IMessage;
  voice?: { url: string; key: string };
  image?: { url: string; key: string };
  media?: IMessageMedia[];
  sharedPost?: IPost;
  sharedProfile?: IUser;
  sharedStory?: IStory;
  deletedAt?: string | null;
  editedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reactions?: IReaction[];
}

export interface IParticipant {
  _id: string;
  chatId: string;
  participantName?: string;
  user: IUser;
  lastReadMessage?: string | null;
  role: ParticipantRole;
  unreadCount: number;
  isMuted: boolean;
  deletedAt?: string | null;
}

export interface IChat {
  _id: string;
  type: ChatType;
  theme: string;
  groupName?: string;
  groupAvatar?: string;
  lastMessage?: IMessage | string;
  lastActivityAt: string;
  chatKey?: string;
  messagePermission: "everyone" | "followers" | "nobody";
  pinned: IMessage[];
  participants: IParticipant[];
  createdAt: string;
  updatedAt: string;
}

export interface INotificationMeta {
  count?: number;
  users?: IUser[];
  message?: string;
}

export interface INotification {
  _id: string;
  toUser: string | IUser;
  fromUser?: IUser;
  type: NotificationTypeEnum;
  entity?: string | IPost | IComment | IMessage | IChat | IStory;
  entityModel?: EntityModelEnum;
  meta?: INotificationMeta;
  isRead: boolean;
  isSended: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IFriendRequest {
  _id: string;
  sender: IUser;
  receiver: IUser;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IRepost {
  _id: string;
  user: IUser;
  post: IPost;
  author: IUser;
  createdAt: string;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}

export interface ITwoFaLoginRequired {
  twoFactorCredintals: boolean;
  userId: string;
}

export interface ITwoFaSetupResponse {
  qrCode: string;
  secret: string;
}

export interface IChatListResponse {
  chats: IChat[];
  nextCursor: string | null;
}

export interface ISharedContentResponse {
  media: Array<{
    _id: string;
    url: string;
    type: MediaTypeEnum;
    createdAt: string;
  }>;
  shared: IMessage[];
  links: Array<{ _id: string; url: string; text: string; createdAt: string }>;
}

export interface IStoryGroupResponse {
  user: IUser;
  stories: IStory[];
  hasUnseen: boolean;
  lastStoryAt: string;
}

export interface IArchiveListResponse {
  items: IStoryArchive[];
  nextCursor: string | null;
}

export interface ISuggestionsResponse extends IUser {
  mutualCount: number;
}
