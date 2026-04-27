import { create } from "zustand";
import { api } from "../lib/axios.config";

export interface ArchiveMedia {
  url: string;
  key: string;
  type: "image" | "video";
  duration?: number;
  backgroundMusic?: String;
  thumbnail: String;
}

export interface ArchiveItem {
  _id: string;
  media: ArchiveMedia;
  viewsCount: number;
  createdAt: string;
  archivedAt: string;
}

interface ArchiveState {
  archives: ArchiveItem[];
  loading: boolean;
  loadingMore: boolean;
  nextCursor: string | null;
  hasMore: boolean;
  fetchArchives: (reset?: boolean) => Promise<void>;
  deleteArchive: (id: string) => Promise<void>;
}

export const useArchiveStore = create<ArchiveState>((set, get) => ({
  archives: [],
  loading: true,
  loadingMore: false,
  nextCursor: null,
  hasMore: true,

  fetchArchives: async (reset = false) => {
    const { nextCursor, loadingMore, hasMore } = get();

    if (!reset && (!hasMore || loadingMore)) return;

    if (reset) {
      set({ loading: true, archives: [], nextCursor: null, hasMore: true });
    } else {
      set({ loadingMore: true });
    }

    try {
      const currentCursor = reset ? null : nextCursor;
      const url = currentCursor
        ? `/archives?limit=15&cursor=${currentCursor}`
        : `/archives?limit=15`;

      const { data } = await api.get(url);

      const newItems = data.payload?.items || [];
      const newNextCursor = data.payload?.nextCursor || null;

      set((state) => ({
        archives: reset ? newItems : [...state.archives, ...newItems],
        nextCursor: newNextCursor,
        hasMore: !!newNextCursor,
        loading: false,
        loadingMore: false,
      }));
    } catch (error) {
      console.error("Failed to fetch archives", error);
      set({ loading: false, loadingMore: false });
    }
  },

  deleteArchive: async (id: string) => {
    set((state) => ({
      archives: state.archives.filter((item) => item._id !== id),
    }));

    try {
      await api.delete(`/archives/${id}`);
    } catch (error) {
      console.error("Failed to delete archive", error);
      get().fetchArchives(true);
    }
  },
}));
