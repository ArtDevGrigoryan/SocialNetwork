import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import { useSocketStore } from "../../store/socket.store";

type Tab = "notifications" | "requests";

interface IUserMini {
  _id: string;
  username: string;
  avatar?: string;
}

interface INotification {
  _id: string;
  type: string;
  createdAt: string;
  isRead: boolean;
  fromUser?: IUserMini;
}

interface IRequest {
  _id: string;
  sender: IUserMini;
  receiver: IUserMini;
  createdAt: string;
}

const notificationText = (type: string) => {
  const map: Record<string, string> = {
    LIKE: "liked your post",
    COMMENT: "commented on your post",
    FOLLOW: "started following you",
    REQUEST: "sent you a follow request",
    ACCEPTED: "accepted your follow request",
    DECLINED: "declined your follow request",
    MESSAGE: "sent you a message",
    NEW_STORY: "shared a story",
    NEW_POST: "shared a post",
  };
  return map[type] || "sent a notification";
};

export default function NotificationsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const socket = useSocketStore((state) => state.socket);
  const [tab, setTab] = useState<Tab>("notifications");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<INotification[]>([]);
  const [incoming, setIncoming] = useState<IRequest[]>([]);
  const [outgoing, setOutgoing] = useState<IRequest[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notificationsRes, incomingRes, outgoingRes] = await Promise.all([
        api.get("/notifications?limit=30"),
        api.get("/friends/requests?type=incoming&limit=30"),
        api.get("/friends/requests?type=outgoing&limit=30"),
      ]);
      setItems(notificationsRes.data.payload || []);
      setIncoming(incomingRes.data.payload || []);
      setOutgoing(outgoingRes.data.payload || []);
    } catch (error) {
      console.error("Failed to load notifications/requests", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onNotification = (notification: INotification) => {
      setItems((prev) => [notification, ...prev]);
    };
    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
    };
  }, [socket]);

  const handleRequestAction = async (
    requestId: string,
    action: "accept" | "decline" | "cancel",
  ) => {
    setActionLoadingId(`${action}:${requestId}`);
    try {
      await api.patch(`/friends/${action}`, { receiver: requestId });
      await fetchData();
      window.dispatchEvent(new Event("requests:changed"));
    } catch (error) {
      console.error(`Failed to ${action} request`, error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/mark-all-read");
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      window.dispatchEvent(new Event("notifications:changed"));
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setItems((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead: true } : item)),
      );
      window.dispatchEvent(new Event("notifications:changed"));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  return (
    <div className="max-w-[740px] mx-auto px-4 md:px-0 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-white">Notifications</h1>
        <button
          onClick={handleMarkAllRead}
          className="text-sm text-neutral-300 hover:text-white"
        >
          Mark all as read
        </button>
      </div>

      <div className="flex border border-neutral-800 rounded-xl overflow-hidden mb-4">
        <button
          onClick={() => setTab("notifications")}
          className={`flex-1 py-2.5 text-sm ${tab === "notifications" ? "bg-neutral-900 text-white" : "text-neutral-400"}`}
        >
          Notifications
        </button>
        <button
          onClick={() => setTab("requests")}
          className={`flex-1 py-2.5 text-sm ${tab === "requests" ? "bg-neutral-900 text-white" : "text-neutral-400"}`}
        >
          Requests
        </button>
      </div>

      <div className="border border-neutral-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="animate-spin text-neutral-500" />
          </div>
        ) : tab === "notifications" ? (
          items.length ? (
            items.map((item) => (
              <div
                key={item._id}
                onClick={() => handleMarkRead(item._id)}
                className={`px-4 py-3 border-b border-neutral-800 last:border-b-0 ${item.isRead ? "bg-black" : "bg-neutral-900/40"}`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.fromUser?.avatar || "/default-avatar.png"}
                    className="w-10 h-10 rounded-full object-cover"
                    alt={item.fromUser?.username || "user"}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-white">
                      <span className="font-semibold">
                        {item.fromUser?.username || "System"}
                      </span>{" "}
                      {notificationText(item.type)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-sm text-neutral-500">No notifications yet.</div>
          )
        ) : (
          <div className="p-4 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Incoming</h3>
              {incoming.length ? (
                incoming.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-b-0"
                  >
                    <Link to={`/profile/${request.sender?._id}`} className="flex items-center gap-3">
                      <img
                        src={request.sender?.avatar || "/default-avatar.png"}
                        className="w-10 h-10 rounded-full object-cover"
                        alt={request.sender?.username}
                      />
                      <span className="text-sm text-white">{request.sender?.username}</span>
                    </Link>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={actionLoadingId === `accept:${request._id}`}
                        onClick={() => handleRequestAction(request._id, "accept")}
                        className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-xs font-semibold"
                      >
                        Accept
                      </button>
                      <button
                        disabled={actionLoadingId === `decline:${request._id}`}
                        onClick={() => handleRequestAction(request._id, "decline")}
                        className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-500">No incoming requests.</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Outgoing</h3>
              {outgoing.length ? (
                outgoing.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-b-0"
                  >
                    <Link to={`/profile/${request.receiver?._id}`} className="flex items-center gap-3">
                      <img
                        src={request.receiver?.avatar || "/default-avatar.png"}
                        className="w-10 h-10 rounded-full object-cover"
                        alt={request.receiver?.username}
                      />
                      <span className="text-sm text-white">{request.receiver?.username}</span>
                    </Link>
                    <button
                      disabled={actionLoadingId === `cancel:${request._id}`}
                      onClick={() => handleRequestAction(request._id, "cancel")}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-500">No outgoing requests.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {!loading && currentUser ? (
        <p className="text-xs text-neutral-500 mt-4">
          Live updates are delivered while socket connection is active.
        </p>
      ) : null}
    </div>
  );
}
