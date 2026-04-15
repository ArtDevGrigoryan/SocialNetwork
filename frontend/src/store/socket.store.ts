import { create } from "zustand";
import { io, Socket } from "socket.io-client";

export interface ISocketUserResult {
  _id: string;
  username: string;
  avatar?: string;
  bio?: string;
}

type SocketState = {
  socket: Socket | null;
  connected: boolean;

  connect: (token: string) => void;
  disconnect: () => void;

  joinChat: (chatId: string) => void;
  sendTyping: (chatId: string) => void;
  sendVoice: (chatId: string) => void;
};

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connected: false,

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

    set({ socket });
  },

  disconnect: () => {
    const socket = get().socket;
    socket?.removeAllListeners();
    socket?.disconnect();

    set({ socket: null, connected: false });
  },

  joinChat: (chatId: string) => {
    const socket = get().socket;
    if (socket && get().connected) {
      socket.emit("join_chat", { chatId });
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
