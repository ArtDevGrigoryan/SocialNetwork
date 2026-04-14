import { useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "../../components/layout/sidebar";
import Header from "../../components/layout/header";
import RightPanel from "../../components/layout/right-panel";
import { useAuthStore } from "../../store/auth.store";
import { useSocketStore } from "../../store/socket.store";
import { api } from "../../lib/axios.config";
import type { IResponse } from "../../types/api.types";
import type { IUser } from "../../types/user.types";

export default function MainLayout() {
  const { isAuthenticated, accessToken, user, setAuth } = useAuthStore();
  const { connect, disconnect } = useSocketStore();

  useEffect(() => {
    const fetchMe = async () => {
      if (isAuthenticated && !user && accessToken) {
        try {
          const { data } = await api.get<IResponse<IUser>>("/auth/me");

          setAuth({
            user: data.payload,
            accessToken,
            refreshToken: localStorage.getItem("refreshToken") || "",
          });
        } catch (error) {
          useAuthStore.getState().logout();
          console.error("Failed to fetch user:", error);
        }
      }
    };

    fetchMe();
  }, [isAuthenticated, user, accessToken, setAuth]);

  useEffect(() => {
    if (isAuthenticated && user && accessToken) {
      connect(accessToken);
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, user, accessToken, connect, disconnect]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="flex max-w-[1400px] mx-auto">
        <aside className="hidden md:flex w-[260px] px-3 py-6 border-r border-neutral-800/60">
          <Sidebar />
        </aside>

        <main className="flex-1 min-h-screen">
          <Header />
          <div className="px-4 md:px-8 py-6">
            <Outlet />
          </div>
        </main>

        <aside className="hidden xl:flex w-[340px] px-4 py-6 border-l border-neutral-800/60">
          <RightPanel />
        </aside>
      </div>
    </div>
  );
}
