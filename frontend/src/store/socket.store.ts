import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { api } from "../lib/axios.config";
import { useNotificationStore } from "./notification.store";
import { useRequestStore } from "./request.store";

export interface ISocketUserResult {
  _id: string;
  username: string;
  avatar?: string;
  bio?: string;
}

export interface IRealtimeNotification {
  _id: string;
  type: string;
  createdAt: string;
  isRead?: boolean;
  meta?: any;
  entity?: any;
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
          const { data } = await api.post("/auth/refresh", {
            accessToken: localStorage.getItem("accessToken"),
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
    socket.on("receive_notification", (notification: IRealtimeNotification) => {
      useNotificationStore
        .getState()
        .addRealtimeNotification(notification as any);
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
