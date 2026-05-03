import { useState, useRef, useEffect, useMemo } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { LogOut, ChevronDown, ChevronLeft } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { Alert, type AlertType } from "../../components/message-popup/alert";

const SETTINGS_GROUPS = [
  {
    title: "Account",
    items: [
      { label: "Edit profile", path: "/settings/edit-profile" },
      { label: "Change password", path: "/settings/change-password" },
      { label: "Two-factor authentication", path: "/settings/two-factor" },
      { label: "Verify email", path: "/settings/verify-email" },
    ],
  },
  {
    title: "Privacy & Notifications",
    items: [
      { label: "Privacy and security", path: "/settings/privacy" },
      { label: "Notifications", path: "/settings/notifications" },
      { label: "Follow requests", path: "/settings/request" },
      { label: "Blocked accounts", path: "/settings/blocked" },
    ],
  },
  {
    title: "Your Activity",
    items: [
      { label: "Archive", path: "/settings/archive" },
      { label: "Saved", path: "/settings/saves" },
      { label: "Reposts", path: "/settings/reposts" },
    ],
  },
  {
    title: "Connections",
    items: [
      { label: "Followers", path: "/settings/followers" },
      { label: "Following", path: "/settings/followings" },
    ],
  },
];

export default function SettingsLayout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [alert, setAlert] = useState<{
    show: boolean;
    type: AlertType;
    message: string;
  }>({
    show: false,
    type: "info",
    message: "",
  });
  const timeoutRef = useRef<number | null>(null);

  const showAlert = (type: AlertType, message: string) => {
    setAlert({ show: true, type, message });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(
      () => setAlert((prev) => ({ ...prev, show: false })),
      3000,
    );
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initialState: Record<string, boolean> = {};
    SETTINGS_GROUPS.forEach((group, index) => {
      const isActive = group.items.some((item) =>
        location.pathname.includes(item.path),
      );
      initialState[group.title] = isActive || index === 0;
    });
    setOpenGroups(initialState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  // Դինամիկ վերցնում ենք ակտիվ էջի վերնագիրը (օրինակ՝ "Edit Profile") Mobile Header-ի համար
  const currentTitle = useMemo(() => {
    for (const group of SETTINGS_GROUPS) {
      const item = group.items.find((i) => location.pathname.includes(i.path));
      if (item) return item.label;
    }
    return "Settings";
  }, [location.pathname]);

  const isMobileRoot =
    location.pathname === "/settings" || location.pathname === "/settings/";

  return (
    <div className="flex h-[100dvh] w-full bg-black text-white relative">
      {alert.show && <Alert type={alert.type} message={alert.message} />}

      {/* Sidebar - Settings Menu */}
      <div
        className={`w-full md:w-[320px] flex flex-col h-full border-r border-neutral-900 bg-black shrink-0 ${
          !isMobileRoot ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-6 md:p-8 pt-8 md:pt-10 pb-6 shrink-0">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
          {SETTINGS_GROUPS.map((group) => {
            const isOpen = openGroups[group.title];

            return (
              <div key={group.title} className="mb-2">
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-neutral-900/30 hover:bg-neutral-800/80 rounded-xl transition-colors select-none"
                >
                  <span className="text-[12px] font-bold text-neutral-300 uppercase tracking-wider">
                    {group.title}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-300 ease-in-out ${
                      isOpen ? "rotate-180 text-white" : "text-neutral-500"
                    }`}
                  />
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100 mt-1 mb-4"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden flex flex-col gap-1 px-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `px-4 py-3 rounded-xl text-[14px] transition-all duration-200 flex items-center ${
                            isActive
                              ? "bg-[#262626] text-white font-semibold shadow-sm border border-neutral-800/50"
                              : "text-neutral-400 hover:bg-neutral-900/80 hover:text-white"
                          }`
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-neutral-900 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-semibold text-[14px]"
          >
            Log out
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Content Area - Child Pages */}
      <div
        className={`flex-1 flex flex-col h-full overflow-hidden bg-black relative ${
          isMobileRoot ? "hidden md:flex" : "flex"
        }`}
      >
        {/* === UNIVERSAL MOBILE HEADER === */}
        <div className="md:hidden sticky top-0 z-20 flex items-center px-2 py-2 bg-black/90 backdrop-blur-md border-b border-neutral-900 shrink-0">
          <button
            onClick={() => navigate("/settings")}
            className="p-2 text-white hover:bg-neutral-800 rounded-full transition-colors flex items-center justify-center"
          >
            <ChevronLeft size={28} strokeWidth={2} />
          </button>
          <h1 className="text-[17px] font-bold tracking-tight ml-1">
            {currentTitle}
          </h1>
        </div>

        {/* Outlet Wrapper */}
        <div className="flex-1 overflow-y-auto w-full h-full relative custom-scrollbar">
          <Outlet context={{ showAlert }} />
        </div>
      </div>
    </div>
  );
}
