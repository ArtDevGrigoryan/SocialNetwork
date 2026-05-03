import { create } from "zustand";
import { api } from "../lib/axios.config";
import type { IResponse, ISuggestionsResponse } from "../types/api.types";

interface SuggestionState {
  suggestions: ISuggestionsResponse[];
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
      const { data } = await api.get<IResponse<ISuggestionsResponse[]>>(
        "/friends/suggestions?limit=5",
      );
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
