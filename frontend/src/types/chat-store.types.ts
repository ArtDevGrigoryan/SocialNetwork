import type {
  GroupActiveTab,
  IChat,
  IMessage,
  ISharedContentPayload,
  IViewerData,
} from "../pages/message/types";

export interface ChatState {
  chats: IChat[];
  messages: IMessage[];
  loadingChats: boolean;
  loadingMessages: boolean;
  sending: boolean;
  addMessage: (message: any) => void;
  removeMessage: (messageId: string) => void;
  updateMessage: (messageId: string, text: string) => void;
  addReaction: (messageId: string, reaction: any) => void;
  removeReaction: (messageId: string, participantId: string) => void;
  setChats: (chats: IChat[] | ((prev: IChat[]) => IChat[])) => void;
  setMessages: (
    messages: IMessage[] | ((prev: IMessage[]) => IMessage[]),
  ) => void;

  removeChat: (chatId: string) => void;
  updateChatLocal: (chatId: string, data: Partial<IChat>) => void;

  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (
    chatId: string,
    participantId: string,
    text: string,
    sharedId: string,
    files?: File[],
    type?: "TEXT" | "MEDIA" | "IMAGE" | "VOICE",
    replyToId?: string,
  ) => Promise<void>;
  editMessage: (msgId: string, text: string) => Promise<void>;
  togglePinMessage: (
    chatId: string,
    participantId: string,
    messageId: string,
  ) => Promise<void>;
}

export interface ChatDetailsState {
  view: "main" | "nicknames" | "members" | "theme" | "privacy" | "options";
  activeTab: GroupActiveTab;
  sharedData: ISharedContentPayload;
  loadingShared: boolean;
  isAddMemberOpen: boolean;
  viewerData: IViewerData | null;
  editingId: string | null;
  nickName: string;
  isEditingGroup: boolean;
  groupNameInput: string;
  groupAvatarLocal: string;

  setView: (
    view: "main" | "nicknames" | "members" | "theme" | "privacy" | "options",
  ) => void;
  setActiveTab: (tab: GroupActiveTab) => void;
  setIsAddMemberOpen: (isOpen: boolean) => void;
  setViewerData: (data: IViewerData | null) => void;
  setEditingId: (id: string | null) => void;
  setNickName: (name: string) => void;
  setIsEditingGroup: (is: boolean) => void;
  setGroupNameInput: (name: string) => void;
  setGroupAvatarLocal: (avatar: string) => void;

  fetchSharedData: (chatId: string) => Promise<void>;
  reset: () => void;
}
