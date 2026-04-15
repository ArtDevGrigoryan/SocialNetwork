import { create } from "zustand";
import type { IUser } from "../types/user.types";

interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: IUser, access: string, refresh: string) => void;
  setUser: (user: IUser) => void;
  patchUser: (data: Partial<IUser>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  isAuthenticated: !!localStorage.getItem("accessToken"),
  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },
  setUser: (user) => set({ user }),
  patchUser: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : state.user,
    })),
  logout: () => {
    localStorage.clear();
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));
