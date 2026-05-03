import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { useChatStore } from "../../store/chat.store";
import { useNotificationStore } from "../../store/notification.store";
import {
  Home,
  MessageCircle,
  Heart,
  User,
  PlusSquare,
  Compass,
} from "lucide-react";
import CreatePostModal from "../post/create-post-modal";

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const { unreadCount, incomingRequests } = useNotificationStore();
  const { totalUnreadCount } = useChatStore();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const totalNotifsCount = unreadCount + incomingRequests.length;

  const displayMsgCount = totalUnreadCount > 9 ? "10+" : totalUnreadCount;
  const displayNotifCount = totalNotifsCount > 9 ? "10+" : totalNotifsCount;

  const navItems = useMemo(
    () => [
      { name: "Home", path: "/", icon: Home },
      { name: "Explore", path: "/explore", icon: Compass },
      { name: "Messages", path: "/messages", icon: MessageCircle },
      { name: "Notifications", path: "/notifications", icon: Heart },
      {
        name: "Create",
        path: "#",
        icon: PlusSquare,
        onClick: () => setIsPostModalOpen(true),
      },
      { name: "Profile", path: `/profile/${user?._id}`, icon: User },
    ],
    [user?._id],
  );

  return (
    <>
      <aside className="group/sidebar hidden md:flex fixed left-0 top-0 h-screen border-r border-neutral-800 flex-col px-3 py-6 w-[76px] hover:w-[244px] bg-black z-[100] transition-all duration-300 overflow-hidden">
        <div className="px-3 mb-8 h-8 flex items-center">
          <h1 className="text-xl font-semibold font-serif italic tracking-tight opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 absolute whitespace-nowrap">
            Bardiner
          </h1>
          <div className="text-2xl font-bold italic opacity-100 group-hover/sidebar:opacity-0 transition-opacity duration-300 absolute">
            B
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1">
          {navItems.map((item) => {
            const isActive =
              item.path !== "#" &&
              (pathname === item.path || pathname.startsWith(`${item.path}/`));
            const Icon = item.icon;

            const ItemContent = (
              <>
                <div className="relative shrink-0">
                  <Icon
                    size={26}
                    strokeWidth={isActive ? 2.4 : 2}
                    className="transition-transform duration-200 group-hover:scale-105"
                  />
                  {item.name === "Messages" && totalUnreadCount > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-blue-500 text-[10px] leading-4 text-white text-center border border-black font-semibold">
                      {displayMsgCount}
                    </span>
                  ) : null}
                  {item.name === "Notifications" && totalNotifsCount > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] leading-4 text-white text-center border border-black font-semibold">
                      {displayNotifCount}
                    </span>
                  ) : null}
                </div>
                <span className="hidden group-hover/sidebar:block text-base whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 delay-75">
                  {item.name}
                </span>
              </>
            );

            return item.path !== "#" ? (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${isActive ? "font-bold text-white bg-neutral-900/50" : "text-neutral-200 hover:bg-neutral-900/50 hover:text-white"}`}
              >
                {ItemContent}
              </Link>
            ) : (
              <button
                key={item.name}
                onClick={item.onClick}
                className="flex items-center gap-4 p-3 rounded-xl text-neutral-200 hover:bg-neutral-900/50 hover:text-white transition-all duration-200 w-full text-left"
              >
                {ItemContent}
              </button>
            );
          })}
        </nav>
      </aside>
      <nav
        className={`md:hidden fixed bottom-0 w-full z-[100] bg-black border-t border-neutral-800 px-2 py-2 ${
          pathname.startsWith("/messages/") && pathname.length > 10
            ? "hidden"
            : "block"
        }`}
      >
        <div className="flex items-center justify-around">
          {navItems
            .filter((item) => item.name !== "Search")
            .map((item) => {
              const isActive =
                item.path !== "#" &&
                (pathname === item.path ||
                  pathname.startsWith(`${item.path}/`));
              const Icon = item.icon;

              if (item.path === "#") {
                return (
                  <button
                    key={item.name}
                    onClick={item.onClick}
                    className="p-2 text-white"
                    aria-label={item.name}
                  >
                    <Icon size={25} />
                  </button>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  aria-label={item.name}
                  className={isActive ? "text-white" : "text-neutral-500"}
                >
                  <div className="relative">
                    <Icon size={25} strokeWidth={isActive ? 2.4 : 2} />
                    {item.name === "Messages" && totalUnreadCount > 0 ? (
                      <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-blue-500 text-[10px] leading-4 text-white text-center font-semibold">
                        {displayMsgCount}
                      </span>
                    ) : null}
                    {item.name === "Notifications" && totalNotifsCount > 0 ? (
                      <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] leading-4 text-white text-center font-semibold">
                        {displayNotifCount}
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
        </div>
      </nav>

      <CreatePostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />
    </>
  );
}
