import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import {
  Home,
  Search,
  MessageCircle,
  User,
  PlusSquare,
  Settings,
  LogOut,
} from "lucide-react";
import CreatePostModal from "../post/create-post-modal";

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Search", path: "/explore", icon: Search },
    { name: "Messages", path: "/messages", icon: MessageCircle },
    {
      name: "Create",
      path: "#",
      icon: PlusSquare,
      onClick: () => setIsPostModalOpen(true),
    },
    { name: "Profile", path: `/profile/${user?._id}`, icon: User },
  ];

  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 h-screen border-r border-neutral-800 flex-col p-3 md:w-20 lg:w-64 bg-black z-50 transition-all">
        <div className="p-4 mb-8">
          <h1 className="text-2xl font-bold hidden lg:block font-serif italic tracking-tighter">
            Bardiner
          </h1>
          <div className="lg:hidden flex justify-center text-2xl font-bold">
            B
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return item.path !== "#" ? (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-900 transition-all ${isActive ? "text-white font-bold" : "text-neutral-400"}`}
              >
                <Icon size={28} strokeWidth={isActive ? 2.5 : 2} />
                <span className="hidden lg:block text-lg">{item.name}</span>
              </Link>
            ) : (
              <button
                key={item.name}
                onClick={item.onClick}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-900 text-neutral-400 transition-all"
              >
                <Icon size={28} />
                <span className="hidden lg:block text-lg">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-neutral-800 pt-4 flex flex-col gap-2">
          <Link
            to="/settings"
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-900 text-neutral-400"
          >
            <Settings size={28} />
            <span className="hidden lg:block">Settings</span>
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors"
          >
            <LogOut size={28} />
            <span className="hidden lg:block">Logout</span>
          </button>
        </div>
      </aside>

      <CreatePostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />
    </>
  );
}
