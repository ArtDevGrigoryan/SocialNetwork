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
  message?: string;
}

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
  | "Post"
  | "Comment"
  | "Message"
  | "Chat"
  | "Story";

export interface INotificationBase {
  _id: string;
  type: NotificationTypeEnum;
  createdAt: string;
  isRead: boolean;
  toUser: string;
  fromUser?: IUserMini;
  isSended?: boolean;
  meta?: INotificationMeta;
}

export interface IMentionNotification extends INotificationBase {
  type: "MENTION";
  entity: IPost | string;
  entityModel: "Post";
}

export interface ISystemNotification extends INotificationBase {
  type: "SYSTEM";
}

export interface ILikeNotification extends INotificationBase {
  type: "LIKE";
  entity: IPost | IStory | string;
  entityModel: "Post" | "Story";
}

export interface IFollowNotification extends INotificationBase {
  type: "FOLLOW";
  entity: IUserMini | string;
  entityModel: "User";
}

export interface IUnfollowNotification extends INotificationBase {
  type: "UNFOLLOW";
  entity: IUserMini | string;
  entityModel: "User";
}

export interface IRequestNotification extends INotificationBase {
  type: "REQUEST";
  entity: IUserMini | string;
  entityModel: "User";
}

export interface ICommentNotification extends INotificationBase {
  type: "COMMENT";
  entity: IComment | string;
  entityModel: "Comment";
}

export interface IMessageNotification extends INotificationBase {
  type: "MESSAGE";
  entity: IMessage | string;
  entityModel: "Message";
}

export interface ICancelRequestNotification extends INotificationBase {
  type: "CANCELLED";
  entity: IUserMini | string;
  entityModel: "User";
}

export interface IDeclinedNotification extends INotificationBase {
  type: "DECLINED";
  entity: IUserMini | string;
  entityModel: "User";
}

export interface IAcceptedNotification extends INotificationBase {
  type: "ACCEPTED";
  entity: IUserMini | string;
  entityModel: "User";
}

export interface INewGroupNotification extends INotificationBase {
  type: "NEW_GROUP";
  entity: IChat | string;
  entityModel: "Chat";
}

export interface IGroupRemovedNotification extends INotificationBase {
  type: "GROUP_REMOVED";
  entity: string;
  entityModel: "Chat";
}

export interface IParticipantRemovedNotification extends INotificationBase {
  type: "PARTICIPANT_REMOVED";
  entity: IUserMini | string;
  entityModel: "User";
}

export interface IParticipantRemovedNoticeNotification extends INotificationBase {
  type: "PARTICIPANT_REMOVED_NOTICE";
  entity: IUserMini | string;
  entityModel: "User";
}

export interface IGroupDisjoinNotification extends INotificationBase {
  type: "GROUP_DISJOIN";
  entity: IChat | string;
  entityModel: "Chat";
}

export interface INewPostNotification extends INotificationBase {
  type: "NEW_POST";
  entity: IPost | string;
  entityModel: "Post";
}

export interface INewStoryNotification extends INotificationBase {
  type: "NEW_STORY";
  entity: IStory | string;
  entityModel: "Story";
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
  | IGroupDisjoinNotification;

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

export type TabType = "notifications" | "requests" | "messages";
