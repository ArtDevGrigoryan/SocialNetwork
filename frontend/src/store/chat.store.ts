import { create } from "zustand";
import { api } from "../lib/axios.config";
import type { ChatState } from "../types/chat-store.types";
import type { IChat, IMessage, IReaction } from "../pages/message/types";

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  messages: [],
  loadingChats: true,
  loadingMessages: false,
  sending: false,

  setChats: (updater) =>
    set((state) => ({
      chats: typeof updater === "function" ? updater(state.chats) : updater,
    })),

  setMessages: (updater) =>
    set((state) => ({
      messages:
        typeof updater === "function" ? updater(state.messages) : updater,
    })),

  removeChat: (chatId: string) =>
    set((state) => ({
      chats: state.chats.filter((c) => c._id !== chatId),
    })),

  updateChatLocal: (chatId: string, data: Partial<IChat>) =>
    set((state) => ({
      chats: state.chats.map((c) => (c._id === chatId ? { ...c, ...data } : c)),
    })),

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

  updateMessage: (messageId: string, text: string) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, text } : m,
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
      set({
        chats: data.payload?.chats || data.payload || [],
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
        set((state) => ({
          chats: state.chats.map((c) => (c._id === chatId ? data.payload : c)),
        }));
      }
    } catch (error) {
      console.error("Failed to pin message", error);
      set({ chats: previousChats });
    }
  },
}));
