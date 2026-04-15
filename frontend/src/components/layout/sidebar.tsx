import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { Home, Compass, MessageCircle, User as UserIcon } from "lucide-react";

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Explore", path: "/explore", icon: Compass },
    { name: "Messages", path: "/messages", icon: MessageCircle },
    { name: "Profile", path: `/profile/${user?._id}`, icon: UserIcon },
  ];

  return (
    <>
      <div className="hidden md:flex fixed left-0 top-0 h-screen border-r border-neutral-800 flex-col p-3 md:w-20 lg:w-64 bg-black z-50">
        <div className="p-4 mb-8">
          <h1 className="text-2xl font-bold hidden lg:block italic font-serif">
            B-Social
          </h1>
          <div className="lg:hidden flex justify-center text-2xl font-bold">
            B
          </div>
        </div>

        <nav className="flex flex-col gap-2 grow">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-900 transition-all duration-200 ${
                pathname === item.path
                  ? "font-bold scale-105"
                  : "text-neutral-300"
              }`}
            >
              <item.icon
                size={28}
                strokeWidth={pathname === item.path ? 2.5 : 2}
              />
              <span className="hidden lg:block text-lg">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 w-full h-14 bg-black border-t border-neutral-900 flex items-center justify-around z-50 px-4">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <item.icon
              size={26}
              className={
                pathname === item.path ? "text-white" : "text-neutral-400"
              }
              strokeWidth={pathname === item.path ? 2.5 : 2}
            />
          </Link>
        ))}
        {/* User Avatar Tiny */}
        <Link to={`/profile/${user?._id}`}>
          <div
            className={`w-7 h-7 rounded-full border ${pathname.includes("profile") ? "border-white" : "border-transparent"}`}
          >
            <img
              src={user?.avatar || "/default-avatar.png"}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </Link>
      </div>
    </>
  );
}
