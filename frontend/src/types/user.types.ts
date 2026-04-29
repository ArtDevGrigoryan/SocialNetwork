export interface IUser {
  _id: string;
  username: string;
  fullName?: string;
  email: string;
  avatar?: string;
  bio?: string;
  website?: string;
  followersCount: number;
  followingCount: number;
  postsCount?: number;
  settings?: {
    showTyping?: boolean;
    [key: string]: unknown;
  };
  status: "ONLINE" | "OFFLINE";
  role: "admin" | "user";
  deactived: boolean;
  isFollowing?: boolean;
  requestStatus?: "PENDING" | "ACCEPTED" | "DECLINED" | null;
  pendingRequestId?: string | null;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface IFriend {
  _id: string;
  follower?: IUser;
  following?: IUser;
}
export interface IPostImage {
  url: string;
  filter: string;
}

export interface IPostMusic {
  url: string;
  title: string;
  startTime: number;
}

export interface IPost {
  _id: string;
  author: IUser | string;
  content: string;
  images: IPostImage[];
  location?: string;
  mentions?: (IUser | string)[];
  music?: IPostMusic;
  likes: number;
  comments: number;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  isArchived: boolean;
  accessRepost: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IStory {
  _id: string;
  user: IUser | string;
  media: {
    url: string;
    key: string;
    backgroundMusic?: string;
    type: "image" | "video";
    duration?: number;
    thumbnail?: string;
  };
  viewsCount: number;
  expiresAt: string;
  createdAt: string;
}

export interface IComment {
  _id: string;
  post: string;
  author: IUser;
  text: string;
  createdAt: string;
}

export interface IChat {
  _id: string;
  participants: IUser[];
  lastMessage?: string;
}

export interface ISharedChat {
  _id: string;
  myParticipantId: string;
}

export interface IMessage {
  _id: string;
  chat: string;
  senderId: string;
  text: string;
  createdAt: string;
}
