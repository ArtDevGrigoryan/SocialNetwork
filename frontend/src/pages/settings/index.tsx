import { useState, useEffect } from "react";
import {
  Lock,
  Shield,
  Bell,
  Smartphone,
  User,
  MailCheck,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Alert, type AlertType } from "../../components/message-popup/alert";
import ChangeUsername from "./change-username";
import VerifyEmail from "./verify-email";
import ChangePassword from "./change-password";
import PrivacySettings from "./privacy";
import NotificationSettings from "./notifications";
import TwoFactorAuth from "./two-factor";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("edit-profile");
  const [mobileView, setMobileView] = useState<"menu" | "content">("menu");
  const [alert, setAlert] = useState<{
    show: boolean;
    type: AlertType;
    message: string;
  }>({
    show: false,
    type: "info",
    message: "",
  });

  useEffect(() => {
    const handlePopState = () => {
      if (mobileView === "content") setMobileView("menu");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [mobileView]);

  const showAlert = (type: AlertType, message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(
      () => setAlert({ show: false, type: "info", message: "" }),
      3000,
    );
  };

  const tabs = [
    { id: "edit-profile", label: "Edit profile", icon: User },
    { id: "verify-email", label: "Verify Email", icon: MailCheck },
    { id: "change-password", label: "Change password", icon: Lock },
    { id: "privacy", label: "Privacy and Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "2fa", label: "Two-Factor Auth", icon: Smartphone },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "edit-profile":
        return <ChangeUsername showAlert={showAlert} />;
      case "verify-email":
        return <VerifyEmail showAlert={showAlert} />;
      case "change-password":
        return <ChangePassword showAlert={showAlert} />;
      case "privacy":
        return <PrivacySettings showAlert={showAlert} />;
      case "notifications":
        return <NotificationSettings showAlert={showAlert} />;
      case "2fa":
        return <TwoFactorAuth showAlert={showAlert} />;
      default:
        return null;
    }
  };

  const activeTabLabel = tabs.find((t) => t.id === activeTab)?.label;

  return (
    <>
      {alert.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-max min-w-[300px] animate-in slide-in-from-top-4">
          <Alert type={alert.type} message={alert.message} />
        </div>
      )}

      {/* DESKTOP VIEW */}
      <div className="hidden md:flex fixed top-0 bottom-0 left-[80px] xl:left-[244px] right-0 bg-black z-20 overflow-hidden">
        <div className="w-[315px] border-r border-neutral-800 bg-black shrink-0 flex flex-col pt-10 pb-6">
          <h2 className="text-xl font-bold text-white px-8 mb-6">Settings</h2>
          <nav className="flex flex-col">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-4 px-8 py-3.5 text-sm transition-all text-left ${
                    isActive
                      ? "bg-neutral-900 font-semibold text-white"
                      : "text-neutral-300 hover:bg-neutral-900/50 hover:text-white"
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    className={isActive ? "text-white" : "text-neutral-400"}
                  />
                  <span className="flex-1">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="flex-1 bg-black overflow-y-auto custom-scrollbar flex justify-center pt-16 pb-20">
          <div className="w-full max-w-[600px] px-8 animate-in fade-in duration-300">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* MOBILE VIEW */}
      <div className="md:hidden flex flex-col w-full min-h-screen bg-black pb-20">
        {mobileView === "menu" ? (
          <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-200 pt-4">
            <h2 className="text-2xl font-bold text-white px-4 mb-4 mt-2">
              Settings
            </h2>
            <nav className="flex flex-col">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileView("content");
                      window.history.pushState(
                        null,
                        "",
                        window.location.pathname,
                      );
                    }}
                    className="flex items-center justify-between px-4 py-4 hover:bg-neutral-900 active:bg-neutral-900 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-white text-[15px]">
                      <Icon
                        size={22}
                        strokeWidth={1.5}
                        className="text-white"
                      />
                      <span>{tab.label}</span>
                    </div>
                    <ChevronRight size={20} className="text-neutral-500" />
                  </button>
                );
              })}
            </nav>
          </div>
        ) : (
          <div className="flex flex-col animate-in slide-in-from-right-4 duration-200">
            <div className="sticky top-0 bg-black z-10 flex items-center px-4 py-3 border-b border-neutral-900">
              <button
                onClick={() => {
                  setMobileView("menu");
                  window.history.back();
                }}
                className="mr-4 p-1 hover:bg-neutral-800 rounded-full transition"
              >
                <ArrowLeft size={24} className="text-white" />
              </button>
              <h2 className="text-lg font-bold text-white">{activeTabLabel}</h2>
            </div>
            <div className="p-4 pt-6">{renderContent()}</div>
          </div>
        )}
      </div>
    </>
  );
}
