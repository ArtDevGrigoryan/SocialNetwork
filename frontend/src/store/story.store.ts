import { create } from "zustand";
import { api } from "../lib/axios.config";
import type {
  MusicTrack,
  StoryStore,
  MediaTransform,
} from "../types/story.types";

const INITIAL_TRANSFORM: MediaTransform = { scale: 1, x: 0, y: 0 };

const trimVideoClientSide = (
  file: File,
  startTime: number,
  duration: number,
  isVideoMuted: boolean,
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.crossOrigin = "anonymous";
    video.playsInline = true;

    video.onloadedmetadata = () => {
      video.currentTime = startTime;
      video.play().catch(reject);
      video.onplaying = () => {
        try {
          const stream = (video as any).captureStream
            ? (video as any).captureStream()
            : (video as any).mozCaptureStream();
          const finalStream = new MediaStream();
          stream
            .getVideoTracks()
            .forEach((track: MediaStreamTrack) => finalStream.addTrack(track));
          if (!isVideoMuted)
            stream
              .getAudioTracks()
              .forEach((track: MediaStreamTrack) =>
                finalStream.addTrack(track),
              );

          const mediaRecorder = new MediaRecorder(finalStream, {
            mimeType: "video/webm",
          });
          const chunks: Blob[] = [];
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };
          mediaRecorder.onstop = () => {
            const trimmedBlob = new Blob(chunks, { type: "video/webm" });
            const trimmedFile = new File(
              [trimmedBlob],
              `chunk-${startTime}.webm`,
              { type: "video/webm" },
            );
            URL.revokeObjectURL(video.src);
            resolve(trimmedFile);
          };
          mediaRecorder.start();
          setTimeout(() => {
            mediaRecorder.stop();
            video.pause();
          }, duration * 1000);
        } catch (err) {
          reject(err);
        }
      };
    };
    video.onerror = reject;
  });
};

export const useStoryStore = create<StoryStore>((set, get) => ({
  otherStories: [],
  loadingFeed: true,
  myStoriesCount: 0,
  hasUnseenMyStory: false,
  editingTextId: null,
  setEditingTextId: (id) => set({ editingTextId: id }),
  videoTrim: { start: 0, end: 90, maxDuration: 90 },
  setVideoTrim: (start, end) =>
    set((state) => ({ videoTrim: { ...state.videoTrim, start, end } })),
  isDraggingItem: false,
  setIsDraggingItem: (val) => set({ isDraggingItem: val }),

  fetchFeed: async (userId) => {
    try {
      set({ loadingFeed: true });
      const { data } = await api.get("/stories");
      const allGroups = (data.payload || []).map((g: any) => ({
        ...g,
        _id: g.user?._id,
      }));
      set({ otherStories: allGroups.filter((g: any) => g._id !== userId) });
      if (userId) {
        const { data: myData } = await api.get(`/stories/user/${userId}`);
        const myStories = myData.payload || [];
        set({
          myStoriesCount: myStories.length,
          hasUnseenMyStory: myStories.some((s: any) => !s.viewer?.seen),
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      set({ loadingFeed: false });
    }
  },

  isCreateModalOpen: false,
  setCreateModalOpen: (isOpen) => {
    set({ isCreateModalOpen: isOpen });
    if (!isOpen) get().resetDraft();
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
  isVideoMuted: false,
  musicWidget: null,
  mediaTransform: INITIAL_TRANSFORM,
  stickers: [],
  texts: [],
  storyLocation: null,
  mentions: [],
  linkSticker: null,

  setMusicWidget: (widget) => set({ musicWidget: widget }),

  addMention: (userId: string, username: string) =>
    set((s) => ({
      mentions: [
        ...s.mentions,
        {
          id: Math.random().toString(36).substring(7),
          userId,
          username,
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
        },
      ],
    })),
  updateMention: (id, updates) =>
    set((s) => ({
      mentions: s.mentions.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  removeMention: (id) =>
    set((s) => ({
      mentions: s.mentions.filter((m) => m.id !== id),
    })),

  setLinkSticker: (link) => set({ linkSticker: link }),

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
        isVideoMuted: false,
        musicWidget: null,
        mentions: [],
        linkSticker: null,
      });
      return;
    }
    const type = file.type.startsWith("video/") ? "video" : "image";
    set({
      draftFile: file,
      draftPreview: URL.createObjectURL(file),
      draftType: type,
      selectedFilter: "none",
      mediaTransform: INITIAL_TRANSFORM,
      stickers: [],
      texts: [],
      storyLocation: null,
      isVideoMuted: false,
      musicWidget: null,
      mentions: [],
      linkSticker: null,
    });
  },

  setSelectedMusic: (music) =>
    set({
      selectedMusic: music,
      musicStartTime: 0,
      musicWidget: music
        ? { x: 0, y: 0, scale: 1, rotation: 0, isHidden: false }
        : null,
    }),
  setShowMusicList: (show) => set({ showMusicList: show }),
  setPlayingMusicId: (id) => set({ playingMusicId: id }),
  setSelectedFilter: (filter) => set({ selectedFilter: filter }),
  setMusicStartTime: (time) => set({ musicStartTime: time }),
  setMusicDuration: (duration) => set({ musicDuration: duration }),
  setIsVideoMuted: (val) => set({ isVideoMuted: val }),
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
    if (!query.trim()) return set({ musicResults: [] });
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
      console.error(error);
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
      isVideoMuted: false,
      musicWidget: null,
      mediaTransform: INITIAL_TRANSFORM,
      stickers: [],
      texts: [],
      storyLocation: null,
      isUploading: false,
      editingTextId: null,
      videoTrim: { start: 0, end: 90, maxDuration: 90 },
      isDraggingItem: false,
      mentions: [],
      linkSticker: null,
    });
  },

  uploadStory: async (userId, customFile?: File) => {
    const state = get();
    let fileToUpload = customFile || state.draftFile;
    if (!fileToUpload) return;

    try {
      set({ isUploading: true });

      const appendCommonFormData = (formData: FormData) => {
        formData.append("type", state.draftType);
        formData.append("isVideoMuted", state.isVideoMuted.toString());
        formData.append("filter", state.selectedFilter);
        formData.append(
          "transform",
          JSON.stringify(customFile ? INITIAL_TRANSFORM : state.mediaTransform),
        );
        formData.append("stickers", JSON.stringify(state.stickers));
        formData.append("texts", JSON.stringify(state.texts));

        if (state.storyLocation)
          formData.append("location", JSON.stringify(state.storyLocation));
        if (state.linkSticker)
          formData.append("linkSticker", JSON.stringify(state.linkSticker));

        if (state.mentions.length > 0) {
          const mentionUsernames = state.mentions.map((m) => m.username);
          formData.append("mentions", JSON.stringify(mentionUsernames));
          formData.append("mentionStickers", JSON.stringify(state.mentions));
        }

        if (state.selectedMusic) {
          formData.append("musicUrl", state.selectedMusic.url);
          formData.append("musicTitle", state.selectedMusic.title);
          formData.append("musicCover", state.selectedMusic.coverArt);
          formData.append("musicStartTime", state.musicStartTime.toString());
          formData.append("musicDuration", state.musicDuration.toString());
          if (state.musicWidget && !state.musicWidget.isHidden)
            formData.append("musicWidget", JSON.stringify(state.musicWidget));
        } else {
          formData.append("musicUrl", "none");
        }
      };

      if (state.draftType === "video" && !customFile) {
        const totalDuration = state.videoTrim.end - state.videoTrim.start;
        const chunksCount = Math.ceil(totalDuration / 30);
        for (let i = 0; i < chunksCount; i++) {
          const chunkStart = state.videoTrim.start + i * 30;
          const chunkDuration = Math.min(30, state.videoTrim.end - chunkStart);
          let chunkFile = fileToUpload;
          try {
            chunkFile = await trimVideoClientSide(
              fileToUpload,
              chunkStart,
              chunkDuration,
              state.isVideoMuted,
            );
          } catch (err) {
            console.log("Trim fallback");
          }

          const formData = new FormData();
          appendCommonFormData(formData);
          formData.append("videoStartTime", chunkStart.toString());
          formData.append("videoDuration", chunkDuration.toString());
          formData.append("story", chunkFile);
          await api.post("/stories", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      } else {
        const formData = new FormData();
        appendCommonFormData(formData);
        formData.append("story", fileToUpload);
        await api.post("/stories", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

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
