import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useSocketStore } from "../../store/socket.store";

export default function Header() {
  const unreadNotificationsCount = useSocketStore(
    (state) => state.unreadNotificationsCount,
  );

  return (
    <div className="md:hidden sticky top-0 z-40 bg-black/85 backdrop-blur-md border-b border-neutral-900 px-4 py-3 flex items-center justify-between">
      <h2 className="text-[30px] leading-none font-serif italic tracking-tight">
        Bardiner
      </h2>
      <Link
        to="/messages"
        className="text-white relative"
        aria-label="Open messages"
      >
        <MessageCircle size={24} />
        {unreadNotificationsCount > 0 ? (
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
        ) : null}
      </Link>
    </div>
  );
}
