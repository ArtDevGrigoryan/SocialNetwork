import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Heart, MessageCircle, UserPlus, Info } from "lucide-react";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import { useSocketStore } from "../../store/socket.store";
import { cn } from "../../lib/utils";

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
  toUser: string;
  isSended?: boolean;
  meta?: {
    count?: number;
    users?: IUserMini[];
  };
  entity?: any; // Այս դաշտը պետք կգա պոստերի (like/comment) նկարները ցուցադրելու համար
}

interface IRequest {
  _id: string;
  sender: IUserMini;
  receiver: IUserMini;
  createdAt: string;
}

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  return `${Math.floor(diffInDays / 7)}w`;
};

export default function NotificationsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const socket = useSocketStore((state) => state.socket);

  const [tab, setTab] = useState<Tab>("notifications");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<INotification[]>([]);
  const [incoming, setIncoming] = useState<IRequest[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notificationsRes, incomingRes] = await Promise.all([
        api.get("/notifications?limit=50"),
        api.get("/friends/requests?type=incoming&limit=50"),
      ]);

      setItems(notificationsRes.data.payload || []);
      setIncoming(incomingRes.data.payload || []);
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
    senderId: string,
    action: "accept" | "decline" | "cancel",
  ) => {
    setActionLoadingId(`${action}:${senderId}`);
    try {
      await api.patch(`/friends/${action}`, { receiver: senderId });
      setIncoming((prev) => prev.filter((req) => req.sender?._id !== senderId));
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

  const handleMarkRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      await api.patch(`/notifications/${id}/read`);
      setItems((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, isRead: true } : item,
        ),
      );
      window.dispatchEvent(new Event("notifications:changed"));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const renderNotificationContent = (item: INotification) => {
    let text = "";
    let icon = null;
    let rightSide = null;

    const primaryUser = item.meta?.users?.[0];
    const count = item.meta?.count || 1;
    const additionalUsers = count > 1 ? ` and ${count - 1} others` : "";

    switch (item.type) {
      case "LIKE":
        text = `liked your post${additionalUsers}.`;
        icon = (
          <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-[2px]">
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          </div>
        );
        if (item.entity?.images?.[0]) {
          rightSide = (
            <Link to={`/post/${item.entity._id}`} className="shrink-0">
              <img
                src={item.entity.images[0]}
                alt="Post"
                className="w-11 h-11 object-cover rounded-md border border-neutral-800"
              />
            </Link>
          );
        }
        break;
      case "COMMENT":
        text = `commented on your post${additionalUsers}.`;
        icon = (
          <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-[2px]">
            <MessageCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
          </div>
        );
        if (item.entity?.images?.[0]) {
          rightSide = (
            <Link to={`/post/${item.entity._id}`} className="shrink-0">
              <img
                src={item.entity.images[0]}
                alt="Post"
                className="w-11 h-11 object-cover rounded-md border border-neutral-800"
              />
            </Link>
          );
        }
        break;
      case "FOLLOW":
        text = `started following you${additionalUsers}.`;
        icon = (
          <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-[2px]">
            <UserPlus className="w-3.5 h-3.5 text-blue-400" />
          </div>
        );
        if (primaryUser) {
          rightSide = (
            <Link to={`/profile/${primaryUser._id}`} className="shrink-0">
              <button className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-semibold rounded-lg transition-colors">
                View
              </button>
            </Link>
          );
        }
        break;
      case "REQUEST":
        text = `requested to follow you${additionalUsers}.`;
        icon = (
          <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-[2px]">
            <UserPlus className="w-3.5 h-3.5 text-yellow-500" />
          </div>
        );
        break;
      case "ACCEPTED":
        text = `accepted your follow request.`;
        break;
      case "NEW_POST":
        text = `shared a new post.`;
        if (item.entity?.images?.[0]) {
          rightSide = (
            <Link to={`/post/${item.entity._id}`} className="shrink-0">
              <img
                src={item.entity.images[0]}
                alt="Post"
                className="w-11 h-11 object-cover rounded-md border border-neutral-800"
              />
            </Link>
          );
        }
        break;
      case "MESSAGE":
        text = `sent you a message${additionalUsers}.`;
        break;
      default:
        text = `sent you a notification.`;
        icon = (
          <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-[2px]">
            <Info className="w-3.5 h-3.5 text-neutral-400" />
          </div>
        );
    }

    return { text, icon, rightSide, primaryUser };
  };

  return (
    <div className="max-w-[600px] mx-auto px-4 md:px-0 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Notifications
        </h1>
        {tab === "notifications" && items.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex mb-6 gap-2 border-b border-neutral-800 pb-px">
        <button
          onClick={() => setTab("notifications")}
          className={cn(
            "flex-1 py-3 text-sm font-semibold transition-colors relative",
            tab === "notifications"
              ? "text-white"
              : "text-neutral-500 hover:text-neutral-300",
          )}
        >
          All
          {tab === "notifications" && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-t-md" />
          )}
        </button>
        <button
          onClick={() => setTab("requests")}
          className={cn(
            "flex-1 py-3 text-sm font-semibold transition-colors relative flex items-center justify-center gap-2",
            tab === "requests"
              ? "text-white"
              : "text-neutral-500 hover:text-neutral-300",
          )}
        >
          Requests
          {incoming.length > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] flex items-center justify-center text-white">
              {incoming.length}
            </span>
          )}
          {tab === "requests" && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-t-md" />
          )}
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {loading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="animate-spin text-neutral-500 w-8 h-8" />
          </div>
        ) : tab === "notifications" ? (
          items.length ? (
            items.map((item) => {
              const { text, icon, rightSide, primaryUser } =
                renderNotificationContent(item);
              const isUnread = !item.isRead;

              // Եթե օգտատերը բացակայում է, կարող ենք բաց թողնել կամ ցույց տալ Default UI
              if (!primaryUser) return null;

              return (
                <div
                  key={item._id}
                  onClick={() => handleMarkRead(item._id, item.isRead)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors",
                    isUnread ? "bg-neutral-900/60" : "hover:bg-neutral-900/40",
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Link
                      to={`/profile/${primaryUser._id}`}
                      className="relative shrink-0"
                    >
                      <img
                        src={primaryUser.avatar || "/default-avatar.png"}
                        className="w-11 h-11 rounded-full object-cover border border-neutral-800"
                        alt={primaryUser.username}
                      />
                      {icon}
                    </Link>
                    <div className="min-w-0 flex flex-col justify-center">
                      <p className="text-sm text-white leading-snug">
                        <Link
                          to={`/profile/${primaryUser._id}`}
                          className="font-bold hover:underline mr-1"
                        >
                          {primaryUser.username}
                        </Link>
                        <span className="text-neutral-300">{text}</span>
                      </p>
                      <p
                        className={cn(
                          "text-xs mt-0.5",
                          isUnread
                            ? "text-blue-500 font-medium"
                            : "text-neutral-500",
                        )}
                      >
                        {getTimeAgo(item.createdAt)}
                      </p>
                    </div>
                  </div>
                  {isUnread && !rightSide && (
                    <div className="shrink-0 w-2 h-2 bg-blue-500 rounded-full ml-4" />
                  )}
                  {rightSide && (
                    <div className="ml-4 shrink-0">{rightSide}</div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full border-2 border-neutral-800 flex items-center justify-center">
                <Heart className="w-8 h-8 text-neutral-600" />
              </div>
              <p className="text-neutral-500 text-sm">
                Activity on your posts will appear here.
              </p>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-1">
            {incoming.length ? (
              incoming.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-neutral-900/40 transition-colors rounded-xl"
                >
                  <Link
                    to={`/profile/${request.sender?._id}`}
                    className="flex items-center gap-4 min-w-0"
                  >
                    <img
                      src={request.sender?.avatar || "/default-avatar.png"}
                      className="w-11 h-11 rounded-full object-cover border border-neutral-800"
                      alt={request.sender?.username}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {request.sender?.username}
                      </p>
                      <p className="text-sm text-neutral-400 truncate">
                        Requested to follow you
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button
                      disabled={
                        actionLoadingId === `accept:${request.sender?._id}`
                      }
                      onClick={() =>
                        handleRequestAction(request.sender?._id, "accept")
                      }
                      className="px-5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoadingId === `accept:${request.sender?._id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Confirm"
                      )}
                    </button>
                    <button
                      disabled={
                        actionLoadingId === `decline:${request.sender?._id}`
                      }
                      onClick={() =>
                        handleRequestAction(request.sender?._id, "decline")
                      }
                      className="px-5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoadingId === `decline:${request.sender?._id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Delete"
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full border-2 border-neutral-800 flex items-center justify-center">
                  <UserPlus className="w-8 h-8 text-neutral-600" />
                </div>
                <p className="text-neutral-500 text-sm">
                  No new follow requests.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
