import { useState, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../store/auth.store";
import { ChevronLeft, LogOut, Settings as SettingsIcon } from "lucide-react";
import { type AlertType, Alert } from "../../components/message-popup/alert";
import { api } from "../../lib/axios.config";

const SETTINGS_LINKS = [
  { path: "/settings/edit-profile", label: "Edit profile" },
  { path: "/settings/change-password", label: "Change password" },
  { path: "/settings/notifications", label: "Notifications" },
  { path: "/settings/privacy", label: "Privacy and security" },
  { path: "/settings/request", label: "Follow requests" },
  { path: "/settings/two-factor", label: "Two-factor authentication" },
  { path: "/settings/verify-email", label: "Verify email" },
  { path: "/settings/archive", label: "Archive" },
  { path: "/settings/blocked", label: "Blocked accounts" },
  { path: "/settings/saves", label: "Saved" },
  { path: "/settings/reposts", label: "Reposts" },
  { path: "/settings/followers", label: "Followers" },
  { path: "/settings/followings", label: "Following" },
];

export default function Settings() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const isRootSettings =
    location.pathname === "/settings" || location.pathname === "/settings/";

  const [alertState, setAlertState] = useState<{
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
    setAlertState({ show: true, type, message });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(
      () => setAlertState((prev) => ({ ...prev, show: false })),
      3000,
    );
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error(e);
    } finally {
      logout();
      navigate("/login");
    }
  };

  return (
    <div className="flex h-[100dvh] md:h-screen w-full bg-black text-white overflow-hidden relative">
      {alertState.show && (
        <Alert
          type={alertState.type}
          message={alertState.message}
          onClose={() => setAlertState((prev) => ({ ...prev, show: false }))}
        />
      )}

      <div
        className={cn(
          "w-full md:w-[320px] lg:w-[350px] shrink-0 border-r border-neutral-800 flex flex-col transition-transform",
          !isRootSettings && "hidden md:flex",
        )}
      >
        <div className="flex items-center gap-3 p-4 md:p-6 border-b border-neutral-800">
          <button onClick={() => navigate(-1)} className="md:hidden">
            <ChevronLeft size={28} />
          </button>
          <h1 className="text-xl md:text-2xl font-bold">Settings</h1>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-2 space-y-1">
            {SETTINGS_LINKS.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "block px-4 py-3 rounded-xl transition-colors font-medium text-sm",
                    isActive
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-300 hover:bg-neutral-900",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-neutral-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl font-semibold transition"
          >
            <span>Log out</span>
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "flex-1 flex flex-col h-[100dvh] md:h-screen overflow-y-auto custom-scrollbar relative",
          isRootSettings && "hidden md:flex",
        )}
      >
        {!isRootSettings && (
          <div className="md:hidden sticky top-0 bg-black/90 backdrop-blur-md z-10 p-4 border-b border-neutral-800 flex items-center gap-3">
            <button
              onClick={() => navigate("/settings")}
              className="text-white"
            >
              <ChevronLeft size={28} />
            </button>
            <span className="font-bold text-lg">Settings</span>
          </div>
        )}

        <div className="w-full max-w-3xl mx-auto p-4 md:p-8 flex-1">
          {isRootSettings ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 hidden md:flex">
              <SettingsIcon size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">
                Select a setting to view details
              </p>
            </div>
          ) : (
            <Outlet context={{ showAlert }} />
          )}
        </div>
      </div>
    </div>
  );
}
