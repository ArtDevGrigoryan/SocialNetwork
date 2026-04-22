import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { useSocketStore } from "../../store/socket.store";
import { api } from "../../lib/axios.config";
import {
  Home,
  Search,
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
  const socket = useSocketStore((state) => state.socket);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [incomingRequestsCount, setIncomingRequestsCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);

  const navItems = useMemo(
    () => [
      { name: "Home", path: "/", icon: Home },
      { name: "Search", path: "/search", icon: Search },
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

  useEffect(() => {
    // [Պահպանված է քո օրիգինալ logic-ը]
    if (!user?._id) return;
    const fetchCounters = async () => {
      try {
        const [notificationsRes, requestsRes, chatsRes] = await Promise.all([
          api.get("/notifications/unread-count"),
          api.get("/friends/requests?type=incoming&limit=50"),
          api.get("/chats?limit=50"),
        ]);
        setNotificationCount(notificationsRes.data?.payload?.count || 0);
        const totalIncoming = requestsRes.data?.payload?.length || 0;
        setIncomingRequestsCount(totalIncoming);
        const chats =
          chatsRes.data?.payload?.chats || chatsRes.data?.payload || [];
        const unreadTotal = chats.reduce((acc: number, chat: any) => {
          const participant = (chat.participants || []).find(
            (item: any) => item.user?._id === user?._id,
          );
          return acc + (participant?.unreadCount || 0);
        }, 0);
        setMessageUnreadCount(unreadTotal);
      } catch (error) {
        console.error("Failed to load sidebar counters", error);
      }
    };
    fetchCounters();
    const refresh = () => fetchCounters();
    window.addEventListener("notifications:changed", refresh);
    window.addEventListener("requests:changed", refresh);
    window.addEventListener("messages:changed", refresh);
    return () => {
      window.removeEventListener("notifications:changed", refresh);
      window.removeEventListener("requests:changed", refresh);
      window.removeEventListener("messages:changed", refresh);
    };
  }, [user?._id]);

  useEffect(() => {
    // [Պահպանված է քո օրիգինալ logic-ը]
    if (!socket) return;
    const onNotification = () => setNotificationCount((value) => value + 1);
    const onMessage = (message: any) => {
      if (!pathname.startsWith("/messages")) {
        if (message?.sender?._id && message.sender._id !== user?._id) {
          setMessageUnreadCount((value) => value + 1);
        }
      }
    };
    socket.on("notification", onNotification);
    socket.on("receive_message", onMessage);
    return () => {
      socket.off("notification", onNotification);
      socket.off("receive_message", onMessage);
    };
  }, [pathname, socket, user?._id]);

  return (
    <>
      {/* Փոփոխված է Sidebar-ի UI-ը՝ hover էֆեկտի համար */}
      <aside className="group/sidebar hidden md:flex fixed left-0 top-0 h-screen border-r border-neutral-800 flex-col px-3 py-6 w-[76px] hover:w-[244px] bg-black z-50 transition-all duration-300 overflow-hidden">
        <div className="px-3 mb-8 h-8 flex items-center">
          {/* Լրիվ լոգոն՝ երևում է միայն hover-ի ժամանակ */}
          <h1 className="text-xl font-semibold font-serif italic tracking-tight opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 absolute whitespace-nowrap">
            Bardiner
          </h1>
          {/* Կարճ լոգոն՝ անհետանում է hover-ի ժամանակ */}
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
                  {item.name === "Messages" && messageUnreadCount > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-blue-500 text-[10px] leading-4 text-white text-center border border-black">
                      {Math.min(messageUnreadCount, 99)}
                    </span>
                  ) : null}
                  {item.name === "Notifications" &&
                  notificationCount + incomingRequestsCount > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] leading-4 text-white text-center border border-black">
                      {Math.min(notificationCount + incomingRequestsCount, 99)}
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
        className={`md:hidden fixed bottom-0 w-full z-50 bg-black border-t border-neutral-800 px-2 py-2 ${
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
                    {item.name === "Messages" && messageUnreadCount > 0 ? (
                      <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-blue-500 text-[10px] leading-4 text-white text-center">
                        {Math.min(messageUnreadCount, 99)}
                      </span>
                    ) : null}
                    {item.name === "Notifications" &&
                    notificationCount + incomingRequestsCount > 0 ? (
                      <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] leading-4 text-white text-center">
                        {Math.min(
                          notificationCount + incomingRequestsCount,
                          99,
                        )}
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
