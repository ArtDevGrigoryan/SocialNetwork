export interface IUserMini {
  _id: string;
  username: string;
  avatar?: string;
  bio?: string;
}

export interface INotificationMeta {
  count?: number;
  users?: IUserMini[];
}

export interface INotification {
  _id: string;
  type:
    | "LIKE"
    | "FOLLOW"
    | "REQUEST"
    | "DECLINED"
    | "ACCEPTED"
    | "COMMENT"
    | "MESSAGE"
    | "NEW_GROUP"
    | "GROUP_REMOVED"
    | "PARTICIPANT_REMOVED"
    | "PARTICIPANT_REMOVED_NOTICE"
    | "NEW_POST"
    | "NEW_STORY"
    | "SYSTEM"
    | "GROUP_DISJOIN";
  createdAt: string;
  isRead: boolean;
  toUser: string;
  fromUser?: IUserMini;
  isSended?: boolean;
  meta?: INotificationMeta;
  entity?: any;
  entityModel?: "User" | "Post" | "Comment" | "Message" | "Chat";
}

export interface IRequest {
  _id: string;
  sender: IUserMini;
  receiver: string;
  createdAt: string;
}

export interface IStoryUpdate {
  userId: string;
  storyId: string;
  action: "NEW_STORY" | "EXPIRED" | "DELETED";
}

export type TabType = "notifications" | "requests" | "messages";
