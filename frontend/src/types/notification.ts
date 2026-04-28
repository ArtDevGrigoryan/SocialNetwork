import type { IChat } from "../pages/message/types";
import type { IComment, IMessage, IPost, IStory } from "./user.types";

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
    | "CANCELLED"
    | "UNFOLLOW"
    | "GROUP_DISJOIN"
    | "MENTION"; // Ավելացված է
  createdAt: string;
  isRead: boolean;
  toUser: string;
  fromUser?: IUserMini;
  isSended?: boolean;
  meta?: INotificationMeta;
  entity?: string | IPost | IStory | IMessage | IChat | IUserMini | IComment;
  entityModel?: "User" | "Post" | "Comment" | "Message" | "Chat" | "Story";
}

export interface IMentionNotification extends INotification {
  type: "MENTION";
  entity: IPost;
  entityModel: "Post";
  meta: INotificationMeta;
}

export interface ISystemNotification extends INotification {
  type: "SYSTEM";
  meta: { count: 0; users: []; message: string };
}
export interface ILikeNotification extends INotification {
  type: "LIKE";
  entity: IPost | IStory;
  entityModel: "Post" | "Story";
  meta: INotificationMeta;
}
export interface IFollowNotification extends INotification {
  type: "FOLLOW";
  entity: IUserMini;
  entityModel: "User";
  meta: INotificationMeta;
}
export interface IUnfollowNotification extends INotification {
  type: "UNFOLLOW";
  entity: IUserMini;
  entityModel: "User";
  meta: INotificationMeta;
}
export interface IRequestNotification extends INotification {
  type: "REQUEST";
  entity: IUserMini;
  entityModel: "User";
  meta: INotificationMeta;
}
export interface ICommentNotification extends INotification {
  type: "COMMENT";
  entity: IComment;
  entityModel: "Comment";
  meta: INotificationMeta;
}
export interface IMessageNotification extends INotification {
  type: "MESSAGE";
  entity: IMessage;
  entityModel: "Message";
  meta: INotificationMeta;
}
export interface ICancelRequestNotification extends INotification {
  type: "CANCELLED";
  entity: IUserMini;
  entityModel: "User";
  meta: INotificationMeta;
}
export interface IDeclinedNotification extends INotification {
  type: "DECLINED";
  entity: IUserMini;
  entityModel: "User";
  meta: INotificationMeta;
}
export interface IAcceptedNotification extends INotification {
  type: "ACCEPTED";
  entity: IUserMini;
  entityModel: "User";
  meta: INotificationMeta;
}
export interface INewGroupNotification extends INotification {
  type: "NEW_GROUP";
  entity: IChat;
  entityModel: "Chat";
  meta: INotificationMeta;
}
export interface IGroupRemovedNotification extends INotification {
  type: "GROUP_REMOVED";
  entity: string;
  entityModel: "Chat";
  meta: INotificationMeta;
}
export interface IParticipantRemovedNotification extends INotification {
  type: "PARTICIPANT_REMOVED";
  entity: IUserMini;
  entityModel: "User";
  meta: INotificationMeta;
}
export interface IParticipantRemovedNoticeNotification extends INotification {
  type: "PARTICIPANT_REMOVED_NOTICE";
  entity: IUserMini;
  entityModel: "User";
  meta: INotificationMeta;
}
export interface INewPostNotification extends INotification {
  type: "NEW_POST";
  entity: IPost;
  entityModel: "Post";
  meta: INotificationMeta;
}
export interface INewStoryNotification extends INotification {
  type: "NEW_STORY";
  entity: IStory;
  entityModel: "Story";
  meta: INotificationMeta;
}

export interface IRequest {
  _id: string;
  sender: IUserMini;
  receiver: IUserMini;
  createdAt: string;
}

export interface IStoryUpdate {
  userId: string;
  storyId: string;
  action: "NEW_STORY" | "EXPIRED" | "DELETED";
}

export type StrictNotification =
  | ILikeNotification
  | ICommentNotification
  | IMessageNotification
  | INewGroupNotification
  | ISystemNotification
  | IFollowNotification
  | IRequestNotification
  | IUnfollowNotification
  | ICancelRequestNotification
  | IDeclinedNotification
  | IAcceptedNotification
  | IGroupRemovedNotification
  | IParticipantRemovedNotification
  | IParticipantRemovedNoticeNotification
  | INewPostNotification
  | INewStoryNotification
  | IMentionNotification
  | (INotification & { type: "GROUP_DISJOIN" });

export type TabType = "notifications" | "requests" | "messages";
