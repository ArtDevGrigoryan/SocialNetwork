import { create } from "zustand";
import { api } from "../lib/axios.config";
import { useNotificationStore } from "./notification.store";

export interface RequestUser {
  _id: string;
  username: string;
  avatar?: string;
  bio?: string;
}

export interface FriendRequestItem {
  _id: string;
  sender: RequestUser;
  receiver: RequestUser;
  status: string;
  createdAt: string;
}

type TabType = "incoming" | "outgoing";

interface RequestState {
  requests: FriendRequestItem[];
  loading: boolean;
  addRequest: (request: FriendRequestItem) => void;
  activeTab: TabType;
  setTab: (tab: TabType) => void;
  fetchRequests: (type?: TabType, page?: number) => Promise<void>;
  actionRequest: (
    request: FriendRequestItem,
    action: "accept" | "decline" | "cancel",
  ) => Promise<void>;
}

export const useRequestStore = create<RequestState>((set, get) => ({
  requests: [],
  loading: true,
  activeTab: "incoming",

  setTab: (tab) => {
    set({ activeTab: tab });
    get().fetchRequests(tab, 1);
  },

  fetchRequests: async (type = get().activeTab, page = 1) => {
    set({ loading: true });
    try {
      const { data } = await api.get(
        `/friends/requests?type=${type}&page=${page}&limit=20`,
      );
      set({
        requests: data.payload || data || [],
        loading: false,
        activeTab: type,
      });
    } catch (error) {
      console.error("Failed to fetch requests", error);
      set({ loading: false });
    }
  },
  addRequest: (request: FriendRequestItem) => {
    set((state) => ({
      requests: [request, ...state.requests],
    }));
  },
  actionRequest: async (request: FriendRequestItem, action) => {
    set((state) => ({
      requests: state.requests.filter((req) => req._id !== request._id),
    }));

    try {
      await api.patch(`/friends/${action}`, { requestId: request._id });
      await useNotificationStore
        .getState()
        .handleRequestAction(request, action);
    } catch (error) {
      console.error(`Failed to ${action} request`, error);
      get().fetchRequests(get().activeTab);
    }
  },
}));
