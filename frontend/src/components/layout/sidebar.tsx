import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import {
  Home,
  Search,
  MessageCircle,
  User,
  PlusSquare,
  Compass,
} from "lucide-react";
import CreatePostModal from "../post/create-post-modal";

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const navItems = useMemo(
    () => [
    { name: "Home", path: "/", icon: Home },
    { name: "Search", path: "/search", icon: Search },
    { name: "Explore", path: "/explore", icon: Compass },
    { name: "Messages", path: "/messages", icon: MessageCircle },
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
      <aside className="hidden md:flex fixed left-0 top-0 h-screen border-r border-neutral-800 flex-col px-3 py-6 md:w-20 lg:w-[244px] bg-black z-50">
        <div className="px-3 mb-8">
          <h1 className="text-2xl font-semibold hidden lg:block font-serif italic tracking-tight">
            Bardiner Social
          </h1>
          <div className="lg:hidden flex justify-center text-2xl font-bold italic">
            B
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1">
          {navItems.map((item) => {
            const isActive =
              item.path !== "#" &&
              (pathname === item.path || pathname.startsWith(`${item.path}/`));
            const Icon = item.icon;
            return item.path !== "#" ? (
              <Link
                key={item.name}
                to={item.path}
                className={`group flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${isActive ? "text-white bg-neutral-900/80" : "text-neutral-300 hover:bg-neutral-900/70 hover:text-white"}`}
              >
                <Icon
                  size={26}
                  strokeWidth={isActive ? 2.4 : 2}
                  className="transition-transform duration-200 group-hover:scale-105"
                />
                <span className="hidden lg:block text-base">{item.name}</span>
              </Link>
            ) : (
              <button
                key={item.name}
                onClick={item.onClick}
                className="group flex items-center gap-4 p-3 rounded-xl text-neutral-300 hover:bg-neutral-900/70 hover:text-white transition-all duration-200"
              >
                <Icon
                  size={26}
                  className="transition-transform duration-200 group-hover:scale-105"
                />
                <span className="hidden lg:block text-base">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <nav className="md:hidden fixed bottom-0 w-full z-50 bg-black border-t border-neutral-800 px-2 py-2">
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
                  <Icon size={25} strokeWidth={isActive ? 2.4 : 2} />
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
