import { create } from "zustand";
import { api } from "../lib/axios.config";

export interface IUserMini {
  _id: string;
  username: string;
  avatar?: string;
}

export interface INotification {
  _id: string;
  type: string;
  createdAt: string;
  isRead: boolean;
  toUser: string;
  meta?: { count?: number; users?: IUserMini[] };
  entity?: any;
}

export interface IRequest {
  _id: string;
  sender: IUserMini;
  receiver: IUserMini;
  createdAt: string;
}

interface NotificationState {
  notifications: INotification[];
  incomingRequests: IRequest[];
  unreadCount: number;
  isLoading: boolean;

  initPushNotifications: () => void;
  fetchData: () => Promise<void>;
  markAsRead: (id: string, isRead: boolean) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  handleRequestAction: (
    request: IRequest,
    action: "accept" | "decline" | "cancel",
  ) => Promise<void>;
  addRealtimeNotification: (notification: INotification) => void;
  addRealtimeRequest: (request: IRequest) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  incomingRequests: [],
  unreadCount: 0,
  isLoading: true,

  initPushNotifications: () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  },

  fetchData: async () => {
    set({ isLoading: true });
    try {
      const [notifRes, reqRes, unreadRes] = await Promise.all([
        api.get("/notifications?limit=50"),
        api.get("/friends/requests?type=incoming&limit=50"),
        api.get("/notifications/unread-count"),
      ]);

      set({
        notifications: notifRes.data?.payload || [],
        incomingRequests: reqRes.data?.payload || [],
        unreadCount: unreadRes.data?.payload?.count || 0,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch notifications data", error);
      set({ isLoading: false });
    }
  },

  markAsRead: async (id, isRead) => {
    if (isRead) return;
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  },

  markAllAsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await api.patch("/notifications/mark-all-read");
    } catch (error) {
      console.error("Failed to mark all read", error);
    }
  },

  handleRequestAction: async (request, action) => {
    set((state) => ({
      incomingRequests: state.incomingRequests.filter(
        (req) => req.sender?._id !== request.sender?._id,
      ),
    }));

    try {
      await api.patch(`/friends/${action}`, { requestId: request._id });
    } catch (error) {
      console.error(`Failed to ${action} request`, error);
      get().fetchData();
      throw error;
    }
  },

  addRealtimeNotification: (notification) => {
    set((state) => {
      // Կանխում ենք նույն notification-ի կրկնակի ավելացումը
      const exists = state.notifications.some(
        (n) => n._id === notification._id,
      );
      if (exists) return state;

      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    });

    // Native Push: ցույց տալ միայն, եթե էջը տեսանելի չէ
    if (
      "Notification" in window &&
      Notification.permission === "granted" &&
      document.visibilityState === "hidden"
    ) {
      const user = notification.meta?.users?.[0]?.username || "Someone";
      let body = "sent you a notification.";

      switch (notification.type) {
        case "LIKE":
          body = `liked your post.`;
          break;
        case "COMMENT":
          body = `commented on your post.`;
          break;
        case "FOLLOW":
          body = `started following you.`;
          break;
        case "MESSAGE":
          body = `sent you a message.`;
          break;
      }

      const notif = new Notification("Bardiner-Social", {
        body: `${user} ${body}`,
        icon: notification.meta?.users?.[0]?.avatar || "/favicon.svg",
        badge: "/favicon.svg",
      });

      notif.onclick = function (event) {
        event.preventDefault();
        window.focus();
        notif.close();
      };
    }
  },

  addRealtimeRequest: (request) => {
    set((state) => ({
      incomingRequests: [request, ...state.incomingRequests],
    }));

    if (
      "Notification" in window &&
      Notification.permission === "granted" &&
      document.visibilityState === "hidden"
    ) {
      new Notification("New Follow Request", {
        body: `${request.sender.username} wants to follow you.`,
        icon: request.sender.avatar || "/favicon.svg",
      });
    }
  },
}));
