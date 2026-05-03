import { create } from "zustand";
import { api } from "../lib/axios.config";
import type { IResponse, IHighlight } from "../types/api.types";

interface HighlightState {
  highlights: IHighlight[];
  loading: boolean;
  isCreateModalOpen: boolean;
  editingHighlightId: string | null;
  setCreateModalOpen: (isOpen: boolean, editId?: string | null) => void;
  fetchUserHighlights: (userId: string) => Promise<void>;
  createHighlight: (
    title: string,
    cover: string,
    archiveIds: string[],
  ) => Promise<void>;
  updateHighlight: (
    id: string,
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
  editingHighlightId: null,

  setCreateModalOpen: (isOpen, editId = null) =>
    set({ isCreateModalOpen: isOpen, editingHighlightId: editId }),

  fetchUserHighlights: async (userId) => {
    set({ loading: true });
    try {
      const { data } = await api.get<IResponse<IHighlight[]>>(
        `/highlights/user/${userId}`,
      );
      set({ highlights: data.payload || [], loading: false });
    } catch (error) {
      console.error("Failed to fetch highlights", error);
      set({ loading: false });
    }
  },

  createHighlight: async (title, cover, archiveIds) => {
    try {
      const { data } = await api.post<IResponse<IHighlight>>("/highlights", {
        title,
        cover,
        archives: archiveIds,
      });
      set((state) => ({
        highlights: [data.payload, ...state.highlights],
        isCreateModalOpen: false,
        editingHighlightId: null,
      }));
    } catch (error) {
      console.error("Failed to create highlight", error);
      throw error;
    }
  },

  updateHighlight: async (id, title, cover, archiveIds) => {
    try {
      const { data } = await api.patch<IResponse<IHighlight>>(
        `/highlights/${id}`,
        {
          title,
          cover,
          archives: archiveIds,
        },
      );
      set((state) => ({
        highlights: state.highlights.map((h) =>
          h._id === id ? data.payload : h,
        ),
        isCreateModalOpen: false,
        editingHighlightId: null,
      }));
    } catch (error) {
      console.error("Failed to update highlight", error);
      throw error;
    }
  },

  deleteHighlight: async (id) => {
    try {
      await api.delete<IResponse<null>>(`/highlights/${id}`);
      set((state) => ({
        highlights: state.highlights.filter((h) => h._id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete highlight", error);
      throw error;
    }
  },
}));
