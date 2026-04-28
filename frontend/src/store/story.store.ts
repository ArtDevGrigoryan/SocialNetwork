import { create } from "zustand";
import { api } from "../lib/axios.config";
import type {
  MusicTrack,
  StoryGroup,
  StoryStore,
  MediaTransform,
} from "../types/story.types";

const INITIAL_TRANSFORM: MediaTransform = { scale: 1, x: 0, y: 0 };

export const useStoryStore = create<StoryStore>((set, get) => ({
  otherStories: [],
  loadingFeed: true,
  myStoriesCount: 0,
  hasUnseenMyStory: false,

  fetchFeed: async (userId) => {
    try {
      set({ loadingFeed: true });
      const { data } = await api.get("/stories");
      const allGroups: StoryGroup[] = (data.payload || []).map((g: any) => ({
        ...g,
        _id: g.user?._id,
      }));

      set({ otherStories: allGroups.filter((g) => g._id !== userId) });

      if (userId) {
        const { data: myData } = await api.get(`/stories/user/${userId}`);
        const myStories = myData.payload || [];
        set({
          myStoriesCount: myStories.length,
          hasUnseenMyStory: myStories.some((s: any) => !s.viewer?.seen),
        });
      }
    } catch (error) {
      console.error("Error fetching story feed:", error);
    } finally {
      set({ loadingFeed: false });
    }
  },

  isCreateModalOpen: false,
  setCreateModalOpen: (isOpen) => {
    set({ isCreateModalOpen: isOpen });
    if (!isOpen) {
      get().resetDraft();
    }
  },

  draftFile: null,
  draftPreview: "",
  draftType: "image",
  selectedMusic: null,
  showMusicList: false,
  playingMusicId: null,
  musicResults: [],
  isSearchingMusic: false,

  selectedFilter: "none",
  musicStartTime: 0,
  musicDuration: 15,

  mediaTransform: INITIAL_TRANSFORM,
  stickers: [],
  texts: [],
  storyLocation: null,

  setDraftFile: (file) => {
    const currentPreview = get().draftPreview;
    if (currentPreview) URL.revokeObjectURL(currentPreview);

    if (!file) {
      set({
        draftFile: null,
        draftPreview: "",
        draftType: "image",
        selectedFilter: "none",
        mediaTransform: INITIAL_TRANSFORM,
        stickers: [],
        texts: [],
        storyLocation: null,
      });
      return;
    }

    const type = file.type.startsWith("video/") ? "video" : "image";
    const preview = URL.createObjectURL(file);

    set({
      draftFile: file,
      draftPreview: preview,
      draftType: type,
      selectedFilter: "none",
      mediaTransform: INITIAL_TRANSFORM,
      stickers: [],
      texts: [],
      storyLocation: null,
    });
  },

  setSelectedMusic: (music) => set({ selectedMusic: music, musicStartTime: 0 }),
  setShowMusicList: (show) => set({ showMusicList: show }),
  setPlayingMusicId: (id) => set({ playingMusicId: id }),
  setSelectedFilter: (filter) => set({ selectedFilter: filter }),
  setMusicStartTime: (time) => set({ musicStartTime: time }),
  setMusicDuration: (duration) => set({ musicDuration: duration }),

  setMediaTransform: (updates) =>
    set((state) => ({
      mediaTransform: { ...state.mediaTransform, ...updates },
    })),
  addSticker: (emoji) =>
    set((state) => ({
      stickers: [
        ...state.stickers,
        {
          id: Math.random().toString(36).substring(7),
          emoji,
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
        },
      ],
    })),
  updateSticker: (id, updates) =>
    set((state) => ({
      stickers: state.stickers.map((s) =>
        s.id === id ? { ...s, ...updates } : s,
      ),
    })),
  removeSticker: (id) =>
    set((state) => ({ stickers: state.stickers.filter((s) => s.id !== id) })),
  addText: (textData) =>
    set((state) => ({
      texts: [
        ...state.texts,
        { ...textData, id: Math.random().toString(36).substring(7) },
      ],
    })),
  updateText: (id, updates) =>
    set((state) => ({
      texts: state.texts.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeText: (id) =>
    set((state) => ({ texts: state.texts.filter((t) => t.id !== id) })),
  setStoryLocation: (loc) => set({ storyLocation: loc }),
  updateLocation: (updates) =>
    set((state) => ({
      storyLocation: state.storyLocation
        ? { ...state.storyLocation, ...updates }
        : null,
    })),

  searchMusic: async (query) => {
    if (!query.trim()) {
      set({ musicResults: [] });
      return;
    }
    try {
      set({ isSearchingMusic: true });
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=20`,
      );
      const data = await res.json();
      const tracks: MusicTrack[] = data.results
        .filter((track: any) => track.previewUrl)
        .map((track: any) => ({
          id: track.trackId.toString(),
          title: track.trackName,
          artist: track.artistName,
          url: track.previewUrl,
          coverArt: track.artworkUrl100,
          duration: 30,
        }));
      set({ musicResults: tracks });
    } catch (error) {
      console.error("Error fetching music:", error);
    } finally {
      set({ isSearchingMusic: false });
    }
  },

  isUploading: false,
  resetDraft: () => {
    const currentPreview = get().draftPreview;
    if (currentPreview) URL.revokeObjectURL(currentPreview);

    set({
      draftFile: null,
      draftPreview: "",
      draftType: "image",
      selectedMusic: null,
      showMusicList: false,
      playingMusicId: null,
      musicResults: [],
      selectedFilter: "none",
      musicStartTime: 0,
      musicDuration: 15,
      mediaTransform: INITIAL_TRANSFORM,
      stickers: [],
      texts: [],
      storyLocation: null,
      isUploading: false,
    });
  },

  uploadStory: async (userId) => {
    const state = get();
    if (!state.draftFile) return;

    try {
      set({ isUploading: true });
      const formData = new FormData();
      formData.append("story", state.draftFile);
      formData.append("type", state.draftType);

      if (state.selectedMusic) {
        formData.append("musicUrl", state.selectedMusic.url);
        formData.append("musicTitle", state.selectedMusic.title);
        formData.append("musicStartTime", state.musicStartTime.toString());
        formData.append("musicDuration", state.musicDuration.toString());
      } else {
        formData.append("musicUrl", "none");
      }

      formData.append("filter", state.selectedFilter);

      if (state.storyLocation) {
        formData.append("location", JSON.stringify(state.storyLocation));
      }
      formData.append("transform", JSON.stringify(state.mediaTransform));
      formData.append("stickers", JSON.stringify(state.stickers));
      formData.append("texts", JSON.stringify(state.texts));

      await api.post("/stories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      get().resetDraft();
      set({ isCreateModalOpen: false });
      if (userId) await get().fetchFeed(userId);
    } catch (error) {
      console.error("Error uploading story:", error);
    } finally {
      set({ isUploading: false });
    }
  },

  viewingUserId: null,
  setViewingUserId: (id) => set({ viewingUserId: id }),
}));
