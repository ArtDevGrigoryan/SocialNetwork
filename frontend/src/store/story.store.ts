import { create } from "zustand";
import { api } from "../lib/axios.config";
import type { MusicTrack, StoryGroup, StoryStore } from "../types/story.types";

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

  setDraftFile: (file) => {
    const currentPreview = get().draftPreview;
    if (currentPreview) URL.revokeObjectURL(currentPreview);

    if (!file) {
      set({ draftFile: null, draftPreview: "", draftType: "image" });
      return;
    }

    const type = file.type.startsWith("video/") ? "video" : "image";
    const preview = URL.createObjectURL(file);
    set({ draftFile: file, draftPreview: preview, draftType: type });
  },

  setSelectedMusic: (music) => set({ selectedMusic: music }),
  setShowMusicList: (show) => set({ showMusicList: show }),
  setPlayingMusicId: (id) => set({ playingMusicId: id }),

  searchMusic: async (query) => {
    if (!query.trim()) {
      set({ musicResults: [] });
      return;
    }
    try {
      set({ isSearchingMusic: true });
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          query,
        )}&media=music&entity=song&limit=20`,
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
      isUploading: false,
    });
  },

  uploadStory: async (userId) => {
    const { draftFile, draftType, selectedMusic } = get();
    if (!draftFile) return;

    try {
      set({ isUploading: true });
      const formData = new FormData();
      formData.append("story", draftFile);
      formData.append("type", draftType);
      formData.append("musicUrl", selectedMusic ? selectedMusic.url : "none");

      await api.post("/stories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      get().resetDraft();
      set({ isCreateModalOpen: false });

      if (userId) {
        await get().fetchFeed(userId);
      }
    } catch (error) {
      console.error("Error uploading story:", error);
    } finally {
      set({ isUploading: false });
    }
  },

  viewingUserId: null,
  setViewingUserId: (id) => set({ viewingUserId: id }),
}));
