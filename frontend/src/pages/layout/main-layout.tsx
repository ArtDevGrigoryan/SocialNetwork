import { useEffect, useRef } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "../../components/layout/sidebar";
import Header from "../../components/layout/header";
import RightPanel from "../../components/layout/right-panel";
import { useAuthStore } from "../../store/auth.store";
import { useSocketStore } from "../../store/socket.store";
import { useUIStore } from "../../store/ui.store";
import { api } from "../../lib/axios.config";
import type { IResponse } from "../../types/api.types";
import type { IUser } from "../../types/user.types";
import { useNotificationSocket } from "../../hooks/useNotification";
import { InAppToast } from "../../components/message-popup/toast";

export default function MainLayout() {
  const { pathname } = useLocation();
  const pathnameRef = useRef(pathname);
  useNotificationSocket();

  const { isAuthenticated, accessToken, user, setUser } = useAuthStore();
  const { connect, disconnect, socket } = useSocketStore();
  const { toasts, addToast } = useUIStore();

  const isMessagePage = pathname.includes("/message");

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const fetchMe = async () => {
      if (isAuthenticated && !user && accessToken) {
        try {
          const { data } = await api.get<IResponse<IUser>>("/auth/me");
          setUser(data.payload);
        } catch (error) {
          useAuthStore.getState().logout();
          console.error("Failed to fetch user:", error);
        }
      }
    };

    fetchMe();
  }, [isAuthenticated, user, accessToken, setUser]);

  useEffect(() => {
    if (isAuthenticated && user && accessToken) {
      connect(accessToken);
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, user, accessToken, connect, disconnect]);

  useEffect(() => {
    if (!socket) return;

    const onNotification = (notification: any) => {
      const from = notification?.fromUser?.username || "Someone";
      const type = String(notification?.type || "").toUpperCase();
      const message =
        type === "MESSAGE"
          ? `${from} sent you a message`
          : `${from} sent you a notification`;
      addToast(message);
    };

    const onMessage = (message: any) => {
      if (!pathnameRef.current.startsWith("/messages")) {
        const from = message?.sender?.username || "Someone";
        addToast(`${from}: ${message?.text || "New message"}`);
      }
    };

    socket.on("notification", onNotification);
    socket.on("receive_message", onMessage);

    return () => {
      socket.off("notification", onNotification);
      socket.off("receive_message", onMessage);
    };
  }, [addToast, socket]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col md:flex-row">
      <div className="fixed top-3 right-3 z-[120] space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-900/95 text-sm text-white shadow-xl animate-in fade-in slide-in-from-right-4"
          >
            {toast.text}
          </div>
        ))}
      </div>
      <Sidebar />

      <div className="flex-1 flex flex-col md:ml-[76px] transition-all duration-300 min-h-screen">
        {!isMessagePage && <Header />}

        <div
          className={`flex justify-center w-full grow ${isMessagePage ? "h-screen overflow-hidden" : ""}`}
        >
          <main
            className={`w-full ${isMessagePage ? "h-full" : "max-w-[630px] pb-24 md:pb-0"}`}
          >
            <div className={`h-full ${isMessagePage ? "" : "py-2 md:py-8"}`}>
              <Outlet />
            </div>
          </main>

          {!isMessagePage && (
            <aside className="hidden xl:block w-[320px] pt-10 pl-10 pr-4 shrink-0">
              <RightPanel />
            </aside>
          )}
        </div>
      </div>
      <InAppToast />
    </div>
  );
}
