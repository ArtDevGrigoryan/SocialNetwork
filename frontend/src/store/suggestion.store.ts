import { create } from "zustand";
import { api } from "../lib/axios.config";

export interface SuggestionUser {
  _id: string;
  username: string;
  avatar?: string;
  bio?: string;
  followersCount: number;
  mutualCount: number;
}

interface SuggestionState {
  suggestions: SuggestionUser[];
  loading: boolean;
  fetchSuggestions: () => Promise<void>;
  removeSuggestion: (id: string) => void;
}

export const useSuggestionStore = create<SuggestionState>((set) => ({
  suggestions: [],
  loading: true,
  fetchSuggestions: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get("/friends/suggestions?limit=5");
      set({ suggestions: data.payload || [], loading: false });
    } catch (error) {
      console.error("Failed to fetch suggestions", error);
      set({ loading: false });
    }
  },
  removeSuggestion: (id) =>
    set((state) => ({
      suggestions: state.suggestions.filter((user) => user._id !== id),
    })),
}));
