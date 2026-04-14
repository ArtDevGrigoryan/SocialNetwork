import { create } from "zustand";
import { io, Socket } from "socket.io-client";

type SocketState = {
  socket: Socket | null;
  connected: boolean;

  connect: (token: string) => void;
  disconnect: () => void;
};

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connected: false,

  connect: (token: string) => {
    if (get().socket) return;

    const socket = io(import.meta.env.VITE_WS_URL, {
      auth: { token },
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
}));
