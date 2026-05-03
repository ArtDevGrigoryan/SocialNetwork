import { Heart, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useChatStore } from "../../store/chat.store";
import { useNotificationStore } from "../../store/notification.store";

export default function Header() {
  const { totalUnreadCount } = useChatStore();
  const { unreadCount, incomingRequests } = useNotificationStore();

  const totalNotifsCount = unreadCount + incomingRequests.length;

  const displayMsgCount = totalUnreadCount > 9 ? "10+" : totalUnreadCount;
  const displayNotifCount = totalNotifsCount > 9 ? "10+" : totalNotifsCount;

  return (
    <div className="md:hidden sticky top-0 z-[100] bg-black/85 backdrop-blur-md border-b border-neutral-900 px-4 py-3 flex items-center justify-between">
      <h2 className="text-[30px] leading-none font-serif italic tracking-tight">
        Bardiner
      </h2>
      <div className="flex items-center gap-4">
        <Link
          to="/notifications"
          className="text-white relative"
          aria-label="Open notifications"
        >
          <Heart size={24} />
          {totalNotifsCount > 0 ? (
            <span className="absolute -right-2 -top-1.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] leading-4 text-white text-center font-semibold">
              {displayNotifCount}
            </span>
          ) : null}
        </Link>
        <Link
          to="/messages"
          className="text-white relative"
          aria-label="Open messages"
        >
          <MessageCircle size={24} />
          {totalUnreadCount > 0 ? (
            <span className="absolute -right-2 -top-1.5 min-w-4 h-4 px-1 rounded-full bg-blue-500 text-[10px] leading-4 text-white text-center font-semibold">
              {displayMsgCount}
            </span>
          ) : null}
        </Link>
      </div>
    </div>
  );
}
