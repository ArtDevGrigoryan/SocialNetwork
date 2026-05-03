import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { api } from "../lib/axios.config";
import { useNotificationStore } from "./notification.store";
import { useRequestStore } from "./request.store";
import { useChatStore } from "./chat.store";
import { useAuthStore } from "./auth.store";
import { useUIStore } from "./ui.store";
import type { StrictNotification } from "../types/notification";

export interface ISocketUserResult {
  _id: string;
  username: string;
  avatar?: string;
  bio?: string;
}

type SocketState = {
  typingData: Record<string, { isRecording?: boolean }>;
  socket: Socket | null;
  connected: boolean;

  connect: (token: string) => void;
  disconnect: () => void;

  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  joinPost: (postId: string) => void;
  leavePost: (postId: string) => void;
  sendTyping: (chatId: string) => void;
  sendVoice: (chatId: string) => void;
};

const typingTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connected: false,
  typingData: {},

  connect: (token: string) => {
    if (get().socket) return;

    const socket = io(import.meta.env.VITE_WS_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      set({ connected: true });
    });

    socket.on("error_event", async (err) => {
      if (err.statusCode === 401 || err.status === 401) {
        console.log("Socket token expired, attempting to refresh...");
        try {
          const { data } = await api.post("/auth/refresh-token", {
            refreshToken: localStorage.getItem("refreshToken"),
          });

          const newToken = data.payload?.accessToken || data.accessToken;
          if (newToken) {
            socket.auth = { token: newToken };
            socket.connect();
          }
        } catch (error) {
          console.error("Socket refresh token failed", error);
          get().disconnect();
        }
      }
    });

    socket.on("disconnect", () => {
      set({ connected: false });
    });

    socket.on("typing", (data) => {
      set((state) => ({
        typingData: {
          ...state.typingData,
          [data.chatId]: { isRecording: false },
        },
      }));

      if (typingTimeouts[data.chatId])
        clearTimeout(typingTimeouts[data.chatId]);
      typingTimeouts[data.chatId] = setTimeout(() => {
        set((state) => {
          const newData = { ...state.typingData };
          delete newData[data.chatId];
          return { typingData: newData };
        });
      }, 3000);
    });

    socket.on("voice", (data) => {
      set((state) => ({
        typingData: {
          ...state.typingData,
          [data.chatId]: { isRecording: true },
        },
      }));

      if (typingTimeouts[data.chatId])
        clearTimeout(typingTimeouts[data.chatId]);
      typingTimeouts[data.chatId] = setTimeout(() => {
        set((state) => {
          const newData = { ...state.typingData };
          delete newData[data.chatId];
          return { typingData: newData };
        });
      }, 3000);
    });

    socket.on("receive_request", (data) => {
      useRequestStore.getState().addRequest(data);
    });

    socket.on("message:reaction", (data) => {
      useChatStore.getState().addReaction(data.messageId, data.reaction);
    });

    socket.on("message:remove_reaction", (data) => {
      useChatStore.getState().removeReaction(data.messageId, data.participantId);
    });

    socket.on("message:deleted", (data) => {
      useChatStore.getState().removeMessage(data.messageId);
    });

    socket.on("message:edited", (data) => {
      useChatStore.getState().updateMessage(data.messageId, data.text, data.media);
    });

    socket.on("chat:new", (chatObj) => {
      useChatStore.getState().addChat(chatObj);
    });

    socket.on("chat:updated", (chatObj) => {
      useChatStore.getState().updateChatLocal(chatObj._id, chatObj);
    });

    socket.on("chat:deleted", (data) => {
      useChatStore.getState().removeChat(data.chatId);
    });

    socket.on("chat:read", (data) => {
      useChatStore.getState().handleChatRead(data.chatId, data.userId);
    });

    socket.on("receive_message", (message: any) => {
      const chatStore = useChatStore.getState();
      const authStore = useAuthStore.getState();
      const uiStore = useUIStore.getState();
      
      chatStore.addMessage(message);

      chatStore.setChats((chats) => {
        const chatIndex = chats.findIndex((c) => c._id === message.chat);
        if (chatIndex === -1) {
          chatStore.fetchChats(); 
          return chats;
        }

        const updatedChat = { ...chats[chatIndex], lastMessage: message._id };
        const isCurrentChat = window.location.pathname === `/messages/${message.chat}`;

        if (!isCurrentChat) {
          updatedChat.participants = updatedChat.participants.map((p) =>
            p.user._id === authStore.user?._id
              ? { ...p, unreadCount: (p.unreadCount || 0) + 1 }
              : p
          );
        }

        const newChats = [...chats];
        newChats.splice(chatIndex, 1);
        newChats.unshift(updatedChat);
        return newChats;
      });

      if (!window.location.pathname.startsWith(`/messages/${message.chat}`)) {
        const from = message?.sender?.username || "Someone";
        uiStore.addToast(`${from}: ${message?.text || "New message"}`);
      }
    });

    socket.on("receive_notification", (notif: StrictNotification) => {
      const uiStore = useUIStore.getState();
      useNotificationStore.getState().addRealtimeNotification(notif);
      
      const from = notif.fromUser?.username || notif.meta?.users?.[0]?.username || "Someone";
      const type = String(notif.type || "").toUpperCase();
      let msg = "sent you a notification";
      
      switch (type) {
        case "LIKE": msg = "liked your post/story"; break;
        case "COMMENT": msg = "commented on your post"; break;
        case "FOLLOW": msg = "started following you"; break;
        case "REQUEST": msg = "requested to follow you"; break;
        case "ACCEPTED": msg = "accepted your follow request"; break;
      }

      uiStore.addToast(`${from} ${msg}`);
    });

    set({ socket });
  },

  disconnect: () => {
    const socket = get().socket;
    socket?.removeAllListeners();
    socket?.disconnect();

    set({
      socket: null,
      connected: false,
    });
  },

  joinChat: (chatId: string) => {
    get().socket?.emit("join_chat", { chatId });
  },

  leaveChat: (chatId: string) => {
    get().socket?.emit("leave_chat", { chatId });
  },

  joinPost: (postId: string) => {
    get().socket?.emit("join_post", { postId });
  },

  leavePost: (postId: string) => {
    get().socket?.emit("leave_post", { postId });
  },

  sendTyping: (chatId: string) => {
    get().socket?.emit("typing", { chatId });
  },

  sendVoice: (chatId: string) => {
    get().socket?.emit("voice", { chatId });
  },
}));