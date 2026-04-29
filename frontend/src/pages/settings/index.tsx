import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../store/auth.store";
import { ChevronLeft } from "lucide-react";
import { type AlertType, Alert } from "../../components/message-popup/alert";

const SETTINGS_LINKS = [
  { path: "/settings/edit-profile", label: "Edit profile" },
  { path: "/settings/change-password", label: "Change password" },
  { path: "/settings/notifications", label: "Notifications" },
  { path: "/settings/privacy", label: "Privacy and security" },
  { path: "/settings/request", label: "Follow requests" },
  { path: "/settings/two-factor", label: "Two-factor authentication" },
  { path: "/settings/verify-email", label: "Verify email" },
  { path: "/settings/archive", label: "Archive" },
];

export default function Settings() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRootSettings =
    location.pathname === "/settings" || location.pathname === "/settings/";

  const [alert, setAlert] = useState<{
    type: AlertType;
    message: string;
  } | null>(null);

  const showAlert = (type: AlertType, message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const settingsContextData = {
    user: useAuthStore((state) => state.user),
    showAlert, 
  };

  const currentLink = SETTINGS_LINKS.find((link) =>
    location.pathname.includes(link.path),
  );

  return (
    <div className="flex w-full h-full bg-black text-white overflow-hidden animate-in fade-in relative">
      {alert && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      <div
        className={cn(
          "w-full md:w-[315px] xl:w-[350px] border-r border-neutral-800 flex flex-col shrink-0 bg-black",
          !isRootSettings && "hidden md:flex",
        )}
      >
        <div className="p-4 md:p-6 pb-3 md:pb-4 border-b border-neutral-800 md:border-none">
          <h2 className="text-xl md:text-2xl font-bold">Settings</h2>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          {SETTINGS_LINKS.map((link) => {
            const isActive = location.pathname.includes(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "block px-4 md:px-6 py-3.5 transition-colors hover:bg-neutral-900/50",
                  isActive
                    ? "bg-neutral-900 font-semibold border-l-2 border-white"
                    : "border-l-2 border-transparent font-normal text-neutral-300",
                )}
              >
                <span className="text-[15px]">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div
        className={cn(
          "flex-1 flex flex-col h-full overflow-hidden bg-black relative",
          isRootSettings && "hidden md:flex",
        )}
      >
        {!isRootSettings && (
          <div className="md:hidden sticky top-0 z-20 flex items-center px-4 py-3 bg-black/90 backdrop-blur-md border-b border-neutral-800 shrink-0">
            <button
              onClick={() => navigate("/settings")}
              className="p-1 -ml-1 mr-2 text-white hover:opacity-70 transition-opacity"
            >
              <ChevronLeft size={28} strokeWidth={2} />
            </button>
            <h1 className="text-lg font-bold tracking-tight">
              {currentLink?.label || "Settings"}
            </h1>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[700px] w-full mx-auto py-6 md:py-10 px-4 md:px-8">
            <Outlet context={settingsContextData} />
          </div>
        </div>
      </div>
    </div>
  );
}
