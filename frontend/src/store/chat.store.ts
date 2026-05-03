import { create } from "zustand";
import { api } from "../lib/axios.config";
import type { ChatState } from "../types/chat-store.types";
import type { IChat, IMessage, IReaction } from "../pages/message/types";
import { useAuthStore } from "./auth.store";

const calculateTotalUnread = (
  chats: IChat[],
  currentUserId?: string,
): number => {
  if (!currentUserId) return 0;
  return chats.reduce((acc, chat) => {
    const p = chat.participants.find((p) => p.user._id === currentUserId);
    return acc + (p?.unreadCount || 0);
  }, 0);
};

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  messages: [],
  loadingChats: true,
  loadingMessages: false,
  sending: false,
  totalUnreadCount: 0,

  setChats: (updater) =>
    set((state) => {
      const newChats =
        typeof updater === "function" ? updater(state.chats) : updater;
      const currentUserId = useAuthStore.getState().user?._id;
      return {
        chats: newChats,
        totalUnreadCount: calculateTotalUnread(newChats, currentUserId),
      };
    }),

  setMessages: (updater) =>
    set((state) => ({
      messages:
        typeof updater === "function" ? updater(state.messages) : updater,
    })),

  addChat: (chat: IChat) =>
    set((state) => {
      if (state.chats.some((c) => c._id === chat._id)) return state;
      const newChats = [chat, ...state.chats];
      const currentUserId = useAuthStore.getState().user?._id;
      return {
        chats: newChats,
        totalUnreadCount: calculateTotalUnread(newChats, currentUserId),
      };
    }),

  removeChat: (chatId: string) =>
    set((state) => {
      const newChats = state.chats.filter((c) => c._id !== chatId);
      const currentUserId = useAuthStore.getState().user?._id;
      return {
        chats: newChats,
        totalUnreadCount: calculateTotalUnread(newChats, currentUserId),
      };
    }),

  updateChatLocal: (chatId: string, data: Partial<IChat>) =>
    set((state) => {
      const newChats = state.chats.map((c) =>
        c._id === chatId ? { ...c, ...data } : c,
      );
      const currentUserId = useAuthStore.getState().user?._id;
      return {
        chats: newChats,
        totalUnreadCount: calculateTotalUnread(newChats, currentUserId),
      };
    }),

  handleChatRead: (chatId: string, userId: string) =>
    set((state) => {
      const newChats = state.chats.map((c) => {
        if (c._id === chatId) {
          return {
            ...c,
            participants: c.participants.map((p) =>
              p.user._id === userId ? { ...p, unreadCount: 0 } : p,
            ),
          };
        }
        return c;
      });
      const currentUserId = useAuthStore.getState().user?._id;
      return {
        chats: newChats,
        totalUnreadCount: calculateTotalUnread(newChats, currentUserId),
      };
    }),

  addMessage: (message: IMessage) =>
    set((state) => {
      const isDuplicate = state.messages.some((m) => m._id === message._id);
      if (isDuplicate) return state;
      return { messages: [...state.messages, message] };
    }),

  removeMessage: (messageId: string) =>
    set((state) => ({
      messages: state.messages.filter((m) => m._id !== messageId),
    })),

  updateMessage: (messageId: string, text: string, media?: any[]) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId
          ? { ...m, text, media: media ? media : m.media }
          : m,
      ),
    })),

  addReaction: (messageId: string, reaction: IReaction) =>
    set((state) => ({
      messages: state.messages.map((m) => {
        if (m._id === messageId) {
          const existingReactions = m.reactions || [];
          const filtered = existingReactions.filter(
            (r) => r.participant !== reaction.participant,
          );
          return { ...m, reactions: [...filtered, reaction] };
        }
        return m;
      }),
    })),

  removeReaction: (messageId: string, participantId: string) =>
    set((state) => ({
      messages: state.messages.map((m) => {
        if (m._id === messageId) {
          return {
            ...m,
            reactions: (m.reactions || []).filter(
              (r) => r.participant !== participantId,
            ),
          };
        }
        return m;
      }),
    })),

  fetchChats: async () => {
    set({ loadingChats: true });
    try {
      const { data } = await api.get("/chats?limit=50");
      const chats = data.payload?.chats || data.payload || [];
      const currentUserId = useAuthStore.getState().user?._id;
      set({
        chats: chats,
        totalUnreadCount: calculateTotalUnread(chats, currentUserId),
        loadingChats: false,
      });
    } catch (error) {
      console.error("Failed to load chats", error);
      set({ loadingChats: false });
    }
  },

  fetchMessages: async (chatId: string) => {
    set({ loadingMessages: true });
    try {
      const { data } = await api.get(`/messages/${chatId}`);
      set({ messages: data.payload?.reverse() || [], loadingMessages: false });

      const userId = useAuthStore.getState().user?._id;
      if (userId) {
        get().handleChatRead(chatId, userId);
      }

      await api.patch(`/chats/read/${chatId}`);
    } catch (error) {
      console.error("Failed to load messages", error);
      set({ loadingMessages: false });
    }
  },

  sendMessage: async (
    chatId,
    participantId,
    text,
    sharedId,
    files,
    type = "TEXT",
    replyToId,
  ) => {
    set({ sending: true });
    try {
      let res;
      if (type === "TEXT") {
        const payload: Record<string, string> = { text, participantId };
        if (replyToId) payload.replyTo = replyToId;
        res = await api.post(`/messages/${chatId}`, payload);
      } else if (type === "MEDIA" && files && files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => formData.append("media", file));
        formData.append("participantId", participantId);
        if (text && text.trim()) formData.append("text", text.trim());
        if (replyToId) formData.append("replyTo", replyToId);
        res = await api.post(`/messages/${chatId}/media`, formData);
      } else if (type === "VOICE" && files && files[0]) {
        const formData = new FormData();
        formData.append("voice", files[0]);
        formData.append("participantId", participantId);
        if (replyToId) formData.append("replyTo", replyToId);
        res = await api.post(`/messages/${chatId}/voice`, formData);
      } else if (
        ["SHARE_POST", "SHARE_PROFILE", "SHARE_STORY"].includes(type)
      ) {
        res = await api.post(`/messages/${chatId}/share`, {
          participantId,
          type,
          sharedId,
          text: text || undefined,
        });
      }

      if (res && res.data && res.data.payload) {
        const newMessage = res.data.payload;
        set((state) => {
          const isDuplicate = state.messages.some(
            (m) => m._id === newMessage._id,
          );
          if (isDuplicate) return state;
          return {
            messages: [...state.messages, newMessage],
          };
        });
      }
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      set({ sending: false });
    }
  },

  editMessage: async (msgId, text) => {
    try {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === msgId ? { ...m, text } : m,
        ),
      }));
      await api.patch(`/messages/${msgId}`, { text });
    } catch (error) {
      console.error("Failed to edit message", error);
    }
  },

  togglePinMessage: async (chatId, participantId, messageId) => {
    const previousChats = get().chats;

    try {
      const { data } = await api.patch(`/chats/${chatId}/message`, {
        participantId,
        messageId,
      });

      if (data?.payload) {
        get().updateChatLocal(chatId, data.payload);
      }
    } catch (error) {
      console.error("Failed to pin message", error);
      set({ chats: previousChats });
    }
  },
}));
