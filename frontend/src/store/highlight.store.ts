import { create } from "zustand";
import { api } from "../lib/axios.config";

export interface IHighlight {
  _id: string;
  title: string;
  cover: string;
  user: string;
  archives: any[];
}

interface HighlightState {
  highlights: IHighlight[];
  loading: boolean;
  isCreateModalOpen: boolean;
  setCreateModalOpen: (isOpen: boolean) => void;
  fetchUserHighlights: (userId: string) => Promise<void>;
  createHighlight: (
    title: string,
    cover: string,
    archiveIds: string[],
  ) => Promise<void>;
  deleteHighlight: (id: string) => Promise<void>;
}

export const useHighlightStore = create<HighlightState>((set) => ({
  highlights: [],
  loading: true,
  isCreateModalOpen: false,

  setCreateModalOpen: (isOpen) => set({ isCreateModalOpen: isOpen }),

  fetchUserHighlights: async (userId) => {
    set({ loading: true });
    try {
      const { data } = await api.get(`/highlights/user/${userId}`);
      set({ highlights: data.payload || [], loading: false });
    } catch (error) {
      console.error("Failed to fetch highlights", error);
      set({ loading: false });
    }
  },

  createHighlight: async (title, cover, archiveIds) => {
    try {
      const { data } = await api.post("/highlights", {
        title,
        cover,
        archives: archiveIds,
      });
      set((state) => ({
        highlights: [data.payload, ...state.highlights],
        isCreateModalOpen: false,
      }));
    } catch (error) {
      console.error("Failed to create highlight", error);
      throw error;
    }
  },

  deleteHighlight: async (id) => {
    try {
      await api.delete(`/highlights/${id}`);
      set((state) => ({
        highlights: state.highlights.filter((h) => h._id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete highlight", error);
      throw error;
    }
  },
}));
