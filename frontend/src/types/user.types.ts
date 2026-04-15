export interface IUser {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  website?: string;
  followersCount: number;
  followingCount: number;
  status: "ONLINE" | "OFFLINE";
  role: "admin" | "user";
  deactived: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface IFriend {
  _id: string;
  follower?: IUser;
  following?: IUser;
}
export interface IPost {
  _id: string;
  author: IUser | string;
  content: string;
  images: string[];
  likes: number;
  comments: number;
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
  content: string;
  createdAt: string;
}

export interface IChat {
  _id: string;
  participants: IUser[];
  lastMessage?: string;
}

export interface IMessage {
  _id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
}