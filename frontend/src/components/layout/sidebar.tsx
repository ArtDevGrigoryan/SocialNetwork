import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();

  const linkStyle = (path: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-xl transition ${
      pathname === path
        ? "bg-neutral-800 text-white shadow"
        : "text-neutral-400 hover:bg-neutral-800/60 hover:text-white"
    }`;

  return (
    <div className="flex flex-col w-full gap-8">
      {/* LOGO */}
      <div className="px-2">
        <h1
          className="text-4xl mb-6 text-center"
          style={{ fontFamily: "Grand Hotel, cursive" }}
        >
          B-Social
        </h1>
      </div>

      {/* NAV */}
      <nav className="flex flex-col gap-2">
        <Link className={linkStyle("/")} to="/">
          🏠 Home
        </Link>
        <Link className={linkStyle("/explore")} to="/explore">
          🔍 Explore
        </Link>
        <Link className={linkStyle("/messages")} to="/messages">
          💬 Messages
        </Link>
        <Link className={linkStyle("/profile")} to={`/profile/${user?._id}`}>
          👤 Profile
        </Link>
      </nav>

      {/* USER */}
      <div className="mt-auto bg-neutral-900/60 p-3 rounded-2xl flex items-center gap-3 hover:bg-neutral-800 transition cursor-pointer">
        <img
          src={user?.avatar || ""}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"
        />
        <div>
          <p className="text-sm font-medium">{user?.username}</p>
          <p className="text-xs text-neutral-400">View profile</p>
        </div>
      </div>
    </div>
  );
}
