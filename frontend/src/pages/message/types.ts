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

export interface ISharedPostData {
  _id: string;
  images?: string[];
  content?: string;
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

export interface ISharedStoryData {
  _id: string;
  media: {
    url: string;
    key: string;
    type: "video" | "image";
    musicUrl?: string;
    musicTitle?: string;
  };
  user: {
    _id: string;
    username: string;
    avatar?: string;
    bio?: string;
  };
  createdAt?: string;
  expiresAt?: string;
  updatedAt?: string;
  viewsCount?: number;
}

export interface IMessage {
  _id?: string;
  chat?: string;
  chatId?: string;
  sender: IUser;
  type:
    | "TEXT"
    | "IMAGE"
    | "VOICE"
    | "MEDIA"
    | "MEDIA_GROUP"
    | "SHARE_POST"
    | "SHARE_PROFILE"
    | "SHARE_STORY";
  text?: string;
  image?: { url: string; key?: string };
  media?: IMedia[];
  voice?: { url: string; key?: string };
  reactions?: IReaction[];
  replyTo?: IMessage | null;
  sharedPost?: ISharedPostData;
  sharedProfile?: ISharedProfileData;
  sharedStory?: ISharedStoryData;
  createdAt?: string;
  editedAt?: string;
}

export interface IChat {
  _id: string;
  type: "dm" | "group";
  theme?: string;
  groupName: string;
  groupAvatar?: string;
  participants: IParticipant[];
  lastMessage?: IMessage;
  lastActivityAt: string;
  pinned?: IMessage[];
}

export interface ExtendedChat extends IChat {}

export interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string | null | undefined;
  existingParticipants: string[];
  onMemberAdded: (participants: IParticipant[]) => void;
}

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

export interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ActiveChatProps {
  chatId?: string;
  chat?: IChat | null;
  activeUser: IParticipant["user"] | null;
  currentUser: IUser | null;
  participants: IParticipant[];
}

export interface ChatHeaderProps {
  chat?: IChat | null;
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
  showName?: boolean;
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
  isPinned?: boolean;
}

export interface MessageInputProps {
  onSendMessage: (
    text: string,
    files?: File[],
    type?:
      | "MEDIA"
      | "VOICE"
      | "TEXT"
      | "SHARE_POST"
      | "SHARE_PROFILE"
      | "SHARE_STORY",
    replyToId?: string,
    sharedId?: string,
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
  isPinned?: boolean;
}

export interface NewChatModalProps {
  onClose: () => void;
  onOpenGroup?: () => void;
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
  onClose: () => void;
  onPinnedMessageClick?: (msgId: string) => void;
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

export type GroupActiveTab = "media" | "links" | "shared" | "pinned";

export interface LinkTabProps {
  links: ISharedLinkItem[];
}

export interface MediaTabProps {
  media: ISharedMediaItem[];
  onOpenMedia: (index: number) => void;
}

export interface MemberTabProps {
  onLeaveGroup: () => void;
}

export interface PinnedTabProps {
  message: IMessage | string;
  onScrollTo: (msgId: string) => void;
  onUnpin?: (msgId: string) => void;
}

export interface SharedTabProps {
  shared: ISharedMessageItem[];
}
