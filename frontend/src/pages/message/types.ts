import type { IUser } from "../../types/user.types";

export interface IParticipant {
  _id: string;
  user: IUser;
  unreadCount: number;
  lastReadMessage: string | null;
  role: "member" | "admin";
  isMuted: boolean;
}

export interface IReaction {
  _id: string;
  type: string;
  reaction?: string; // Բազայում և սոքեթում երբեմն type է, երբեմն reaction
  participant: string | IParticipant;
  message: string;
  createdAt?: string;
}

export interface IMedia {
  url: string;
  key?: string;
  mediaType: "IMAGE" | "VIDEO";
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
  participants: IParticipant[];
  lastMessage?: IMessage;
  lastActivityAt: string;
}

export interface ExtendedChat extends IChat {}

// --- Socket Event Payloads (ՆՈՐ: Type Safety-ի համար) ---

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
}

export interface ChatListProps {
  chats: ExtendedChat[];
  chatId?: string;
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
  isOpen: boolean;
  onClose: () => void;
  mediaList: IMediaItem[];
  initialIndex: number;
}

export interface IMediaItem {
  url: string;
  mediaType: "IMAGE" | "VIDEO";
}
