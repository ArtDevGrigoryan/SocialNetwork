import { Heart, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";

export default function Header() {
  const currentUser = useAuthStore((state) => state.user);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const [notificationsRes, chatsRes] = await Promise.all([
          api.get("/notifications/unread-count"),
          api.get("/chats?limit=50"),
        ]);
        setNotificationCount(notificationsRes.data?.payload?.count || 0);
        const chats = chatsRes.data?.payload?.chats || chatsRes.data?.payload || [];
        const unreadTotal = chats.reduce((acc: number, chat: any) => {
          const mine = (chat.participants || []).find(
            (participant: any) => participant.user?._id === currentUser?._id,
          );
          return acc + (mine?.unreadCount || 0);
        }, 0);
        setMessageUnreadCount(unreadTotal);
      } catch (error) {
        console.error("Failed to load mobile header counters", error);
      }
    };
    fetchCounters();

    const refresh = () => fetchCounters();
    window.addEventListener("notifications:changed", refresh);
    window.addEventListener("messages:changed", refresh);
    return () => {
      window.removeEventListener("notifications:changed", refresh);
      window.removeEventListener("messages:changed", refresh);
    };
  }, [currentUser?._id]);

  return (
    <div className="md:hidden sticky top-0 z-40 bg-black/85 backdrop-blur-md border-b border-neutral-900 px-4 py-3 flex items-center justify-between">
      <h2 className="text-[30px] leading-none font-serif italic tracking-tight">
        Bardiner
      </h2>
      <div className="flex items-center gap-4">
        <Link to="/notifications" className="text-white relative" aria-label="Open notifications">
          <Heart size={24} />
          {notificationCount > 0 ? (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
          ) : null}
        </Link>
        <Link to="/messages" className="text-white relative" aria-label="Open messages">
          <MessageCircle size={24} />
          {messageUnreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
          ) : null}
        </Link>
      </div>
    </div>
  );
}
