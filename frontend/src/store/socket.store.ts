import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { api } from "../lib/axios.config";

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
}

type SocketState = {
  typingData: Record<string, { isRecording?: boolean }>;
  socket: Socket | null;
  connected: boolean;
  notifications: IRealtimeNotification[];
  unreadNotificationsCount: number;

  connect: (token: string) => void;
  disconnect: () => void;
  markNotificationRead: (notificationId: string) => void;

  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  joinPost: (postId: string) => void;
  leavePost: (postId: string) => void;
  sendTyping: (chatId: string) => void;
  sendVoice: (chatId: string) => void;
};

// ՊԱՀՈՒՄ ԵՆՔ ԹԱՅՄԵՐՆԵՐԸ ԱՅՍՏԵՂ
const typingTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connected: false,
  notifications: [],
  unreadNotificationsCount: 0,
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

    // ԼՍՈՒՄ ԵՆՔ TYPING ԵՎ ՄԱՔՐՈՒՄ 3 ՎԱՅՐԿՅԱՆԻՑ
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

    // ԼՍՈՒՄ ԵՆՔ VOICE ԵՎ ՄԱՔՐՈՒՄ 3 ՎԱՅՐԿՅԱՆԻՑ
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

    socket.on("notification", (notification: IRealtimeNotification) => {
      set((state) => ({
        notifications: [notification, ...state.notifications].slice(0, 100),
        unreadNotificationsCount: state.unreadNotificationsCount + 1,
      }));
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
      notifications: [],
      unreadNotificationsCount: 0,
    });
  },

  markNotificationRead: (notificationId: string) => {
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item._id === notificationId ? { ...item, isRead: true } : item,
      ),
      unreadNotificationsCount: Math.max(0, state.unreadNotificationsCount - 1),
    }));
  },

  joinChat: (chatId: string) => {
    const socket = get().socket;
    if (socket) {
      socket.emit("join_chat", { chatId });
    }
  },

  leaveChat: (chatId: string) => {
    const socket = get().socket;
    if (socket) {
      socket.emit("leave_chat", { chatId });
    }
  },

  joinPost: (postId: string) => {
    const socket = get().socket;
    if (socket) {
      socket.emit("join_post", { postId });
    }
  },

  leavePost: (postId: string) => {
    const socket = get().socket;
    if (socket) {
      socket.emit("leave_post", { postId });
    }
  },

  sendTyping: (chatId: string) => {
    const socket = get().socket;
    if (socket) {
      socket.emit("typing", { chatId });
    }
  },

  sendVoice: (chatId: string) => {
    const socket = get().socket;
    if (socket) {
      socket.emit("voice", { chatId });
    }
  },
}));
