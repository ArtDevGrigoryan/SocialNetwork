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
  const { isAuthenticated, accessToken, user, setAuth, setUser } =
    useAuthStore();
  const { connect, disconnect } = useSocketStore();

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
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col md:ml-20 lg:ml-64 transition-all duration-300">
        <Header />

        <div className="flex justify-center w-full grow">
          <main className="w-full max-w-[630px] pb-20 md:pb-0">
            <div className="py-2 md:py-8">
              <Outlet />
            </div>
          </main>

          <aside className="hidden xl:block w-[320px] pt-10 pl-10 pr-4">
            <RightPanel />
          </aside>
        </div>
      </div>
    </div>
  );
}
