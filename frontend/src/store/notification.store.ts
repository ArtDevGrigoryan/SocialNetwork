import { create } from "zustand";
import { api } from "../lib/axios.config";
import type {
  IMessageNotification,
  INotification,
  IRequest,
} from "../types/notification";

interface NotificationState {
  notifications: INotification[];
  incomingRequests: IRequest[];
  unreadCount: number;
  isLoading: boolean;
  activeToast: INotification | null;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  setActiveToast: (notification: INotification | null) => void;
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
  activeToast: null,

  setActiveToast: (notification) => set({ activeToast: notification }),
  deleteNotification: async (id) => {
    set((state) => {
      const notifToRemove = state.notifications.find((n) => n._id === id);
      const isUnread = notifToRemove && !notifToRemove.isRead;

      return {
        notifications: state.notifications.filter((n) => n._id !== id),
        unreadCount: isUnread
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    });

    try {
      await api.delete(`/notifications/${id}`);
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  },
  deleteAllNotifications: async () => {
    set({ notifications: [], unreadCount: 0 });

    try {
      await api.delete("/notifications");
    } catch (error) {
      console.error("Failed to delete all notifications", error);
    }
  },
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
      console.error("Failed to fetch notifications", error);
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
    const previousRequests = get().incomingRequests;
    set((state) => ({
      incomingRequests: state.incomingRequests.filter(
        (req) => req.sender?._id !== request.sender?._id,
      ),
    }));

    try {
      await api.patch(`/friends/${action}`, { requestId: request._id });
    } catch (error) {
      console.error(`Failed to ${action} request`, error);
      set({ incomingRequests: previousRequests });
      throw error;
    }
  },

  addRealtimeNotification: (notification) => {
    if (notification.type === "MESSAGE") {
      const notif = notification as IMessageNotification;
      const currentPath = window.location.pathname;
      const id = notif.entity.chat;
      const isInChat = currentPath.includes(id);

      if (isInChat) {
        return;
      }
    }

    set((state) => {
      const exists = state.notifications.some(
        (n) => n._id === notification._id,
      );
      if (exists) return state;

      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
        activeToast: notification,
      };
    });

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
        case "ACCEPTED":
          body = `accepted your follow request.`;
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
    set((state) => {
      if (state.incomingRequests.some((r) => r._id === request._id))
        return state;
      return { incomingRequests: [request, ...state.incomingRequests] };
    });

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
