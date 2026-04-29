import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MusicState {
  activePostId: string | null;
  setActivePost: (id: string | null) => void;
  isMuted: boolean;
  toggleMute: () => void;
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set) => ({
      isMuted: true,
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      activePostId: null,
      setActivePost: (id) =>
        set((state) => {
          if (state.activePostId === id) return state;
          return { activePostId: id };
        }),
    }),
    { name: "bardiner-music-preference" },
  ),
);
