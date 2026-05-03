import { create } from "zustand";
import { api } from "../lib/axios.config";
import { useNotificationStore } from "./notification.store";
import type { IResponse, IFriendRequest } from "../types/api.types";

type TabType = "incoming" | "outgoing";

interface RequestState {
  requests: IFriendRequest[];
  loading: boolean;
  addRequest: (request: IFriendRequest) => void;
  activeTab: TabType;
  setTab: (tab: TabType) => void;
  fetchRequests: (type?: TabType, page?: number) => Promise<void>;
  actionRequest: (
    request: IFriendRequest,
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
      const { data } = await api.get<IResponse<IFriendRequest[]>>(
        `/friends/requests?type=${type}&page=${page}&limit=20`,
      );
      set({
        requests: data.payload || [],
        loading: false,
        activeTab: type,
      });
    } catch (error) {
      console.error("Failed to fetch requests", error);
      set({ loading: false });
    }
  },
  addRequest: (request) => {
    set((state) => ({
      requests: [request, ...state.requests],
    }));
  },
  actionRequest: async (request, action) => {
    set((state) => ({
      requests: state.requests.filter((req) => req._id !== request._id),
    }));

    try {
      await api.patch<IResponse<null>>(`/friends/${action}`, {
        requestId: request._id,
      });
      await useNotificationStore
        .getState()
        .handleRequestAction(request, action);
    } catch (error) {
      console.error(`Failed to ${action} request`, error);
      get().fetchRequests(get().activeTab);
    }
  },
}));
