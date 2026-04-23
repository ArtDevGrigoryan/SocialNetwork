import type { IUser } from "../../types/user.types";

export interface IParticipant {
  _id: string;
  user: IUser;
  participantName: string;
  unreadCount: number;
  lastReadMessage: string | null;
  role: "member" | "admin";
  isMuted: boolean;
}

export interface IReaction {
  _id: string;
  type: string;
  reaction?: string;
  participant: string | IParticipant;
  message: string;
  createdAt?: string;
}

export interface IMedia {
  url: string;
  key?: string;
  mediaType: "IMAGE" | "VIDEO" | "LINK";
  linkUrl?: string;
  title?: string;
  description?: string;
}

export interface IMessage {
  _id?: string;
  chat?: string;
  chatId?: string;
  sender: IUser;
  type: "TEXT" | "IMAGE" | "VOICE" | "MEDIA" | "MEDIA_GROUP";
  text?: string;
  image?: { url: string; key?: string };
  media?: IMedia[];
  voice?: { url: string; key?: string };
  reactions?: IReaction[];
  replyTo?: IMessage | null;
  createdAt?: string;
  editedAt?: string;
}

export interface IChat {
  _id: string;
  type: "dm" | "group";
  groupName: string;
  groupAvatar?: string;
  participants: IParticipant[];
  lastMessage?: IMessage;
  lastActivityAt: string;
}

export interface ExtendedChat extends IChat {}

export interface ISocketReactionPayload {
  messageId: string;
  reaction: IReaction;
}

export interface ISocketRemoveReactionPayload {
  messageId: string;
  participantId: string;
}

export interface ISocketDeletedMsgPayload {
  messageId: string;
}

export interface ISocketEditedMsgPayload {
  messageId: string;
  text: string;
}

export interface ISocketChatReadPayload {
  chatId: string;
  userId: string;
}

export interface ISocketTypingPayload {
  chatId: string;
  _id: string;
  username?: string;
  isRecording?: boolean;
}

export interface ActiveChatProps {
  chatId?: string;
  activeUser: IParticipant["user"] | null;
  currentUser: IUser | null;
  messages: IMessage[];
  participants: IParticipant[];
  loading: boolean;
  sending: boolean;
  onSendMessage: (
    text: string,
    files?: File[],
    type?: "MEDIA" | "VOICE" | "TEXT",
    replyToId?: string,
  ) => void;
  onEditMessage: (msgId: string, text: string) => void;
}

export interface ChatHeaderProps {
  activeUser: IParticipant["user"] | null;
  onHeaderClick?: () => void;
}

export interface ChatListProps {
  chats: ExtendedChat[];
  currentUser: IUser;
  loading: boolean;
  typingData?: Record<string, { isRecording?: boolean }>;
}

export interface MessageBubbleProps {
  msg: IMessage;
  isMine: boolean;
  showAvatar: boolean;
  isSequenceMatch?: boolean;
  participantId: string | null;
  chatParticipants: IParticipant[];
  onSetEdit?: (msg: IMessage) => void;
  onSetReply?: (msg: IMessage) => void;
  isLastMessage?: boolean;
  isSeen?: boolean;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
}

export interface MessageInputProps {
  onSendMessage: (
    text: string,
    files?: File[],
    type?: "MEDIA" | "VOICE" | "TEXT",
    replyToId?: string,
  ) => void;
  replyingMessage: IMessage | null | string;
  onEditMessage?: (text: string) => void;
  editingMessage?: IMessage | null;
  onCancelEdit?: () => void;
  onCancelReply?: () => void;
  sending: boolean;
}

export interface MessageMediaProps {
  msg: IMessage;
}

export interface MessageMenuProps {
  msg: IMessage;
  isMine: boolean;
  onReaction: (emoji: string) => void;
  onSetReply?: (msg: IMessage) => void;
  onSetEdit?: (msg: IMessage) => void;
  onUnsend: () => void;
  setActiveMenuId: (id: string | null) => void;
}

export interface NewChatModalProps {
  onClose: () => void;
}

export interface ReactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reactions: IReaction[];
  chatParticipants: IParticipant[];
  currentParticipantId: string | null;
  onRemoveReaction: (emoji: string) => void;
}

export interface TypingIndicatorProps {
  state: "typing" | "recording" | null;
}

export interface VoicePlayerProps {
  url: string;
  isMine: boolean;
}

export interface MediaViewerProps {
  isOpen?: boolean;
  media: IMediaItem[];
  initialIndex: number;
  onClose: () => void;
}

export interface IMediaItem {
  url: string;
  mediaType: "IMAGE" | "VIDEO";
}

export interface ChatDetailsProps {
  chatId: string;
  onClose: () => void;
  activeUser: IParticipant["user"] | null;
}

export interface ISharedMediaItem {
  _id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  createdAt: string;
}

export interface ISharedLinkItem {
  _id: string;
  url: string;
  text: string;
  createdAt: string;
}

export interface ISharedPostData {
  _id: string;
  images?: string[];
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
}

export interface ISharedProfileData {
  _id: string;
  username: string;
  avatar?: string;
  bio?: string;
}

export interface ISharedMessageItem {
  _id: string;
  type: "SHARE_POST" | "SHARE_PROFILE";
  sharedPost?: ISharedPostData;
  sharedProfile?: ISharedProfileData;
  createdAt: string;
}

export interface ISharedContentPayload {
  media: ISharedMediaItem[];
  shared: ISharedMessageItem[];
  links: ISharedLinkItem[];
}

export interface IViewerData {
  items: IMediaItem[];
  initialIndex: number;
}

export type ChatActiveTab = "media" | "links" | "shared";
