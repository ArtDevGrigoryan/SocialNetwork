import { create } from "zustand";
import { io, Socket } from "socket.io-client";

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
  socket: Socket | null;
  connected: boolean;
  notifications: IRealtimeNotification[];
  unreadNotificationsCount: number;

  connect: (token: string) => void;
  disconnect: () => void;
  markNotificationRead: (notificationId: string) => void;

  joinChat: (chatId: string) => void;
  joinPost: (postId: string) => void;
  leavePost: (postId: string) => void;
  sendTyping: (chatId: string) => void;
  sendVoice: (chatId: string) => void;
};

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connected: false,
  notifications: [],
  unreadNotificationsCount: 0,

  connect: (token: string) => {
    if (get().socket) return;

    const socket = io(import.meta.env.VITE_WS_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      set({ connected: true });
    });

    socket.on("disconnect", () => {
      set({ connected: false });
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
    if (socket && get().connected) {
      socket.emit("join_chat", { chatId });
    }
  },

  joinPost: (postId: string) => {
    const socket = get().socket;
    if (socket && get().connected) {
      socket.emit("join_post", { postId });
    }
  },

  leavePost: (postId: string) => {
    const socket = get().socket;
    if (socket && get().connected) {
      socket.emit("leave_post", { postId });
    }
  },

  sendTyping: (chatId: string) => {
    const socket = get().socket;
    if (socket && get().connected) {
      socket.emit("typing", { chatId });
    }
  },

  sendVoice: (chatId: string) => {
    const socket = get().socket;
    if (socket && get().connected) {
      socket.emit("voice", { chatId });
    }
  },
}));
