import { create } from "zustand";
import { api } from "../lib/axios.config";
import type { ChatDetailsState } from "../types/chat-store.types";

export const useChatDetailsStore = create<ChatDetailsState>((set) => ({
  view: "main",
  activeTab: "media",
  sharedData: { media: [], links: [], shared: [] },
  loadingShared: true,
  isAddMemberOpen: false,
  viewerData: null,
  editingId: null,
  nickName: "",
  isEditingGroup: false,
  groupNameInput: "",
  groupAvatarLocal: "",

  setView: (view) => set({ view }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setIsAddMemberOpen: (isAddMemberOpen) => set({ isAddMemberOpen }),
  setViewerData: (viewerData) => set({ viewerData }),
  setEditingId: (editingId) => set({ editingId }),
  setNickName: (nickName) => set({ nickName }),
  setIsEditingGroup: (isEditingGroup) => set({ isEditingGroup }),
  setGroupNameInput: (groupNameInput) => set({ groupNameInput }),
  setGroupAvatarLocal: (groupAvatarLocal) => set({ groupAvatarLocal }),

  fetchSharedData: async (chatId) => {
    set({ loadingShared: true });
    try {
      const { data } = await api.get(`/messages/${chatId}/shared`);
      set({ sharedData: data.payload, loadingShared: false });
    } catch (error) {
      console.error(error);
      set({ loadingShared: false });
    }
  },

  reset: () =>
    set({
      view: "main",
      activeTab: "media",
      sharedData: { media: [], links: [], shared: [] },
      loadingShared: true,
      isAddMemberOpen: false,
      viewerData: null,
      editingId: null,
      nickName: "",
      isEditingGroup: false,
      groupNameInput: "",
      groupAvatarLocal: "",
    }),
}));
