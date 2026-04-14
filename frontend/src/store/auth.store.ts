import { create } from "zustand";
import type { IUser } from "../types/user.types";

type AuthState = {
  user: IUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (data: {
    user: IUser;
    accessToken: string;
    refreshToken: string;
  }) => void;

  setUser: (user: IUser) => void;

  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  isAuthenticated: !!localStorage.getItem("accessToken"),

  setAuth: ({ user, accessToken, refreshToken }) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },

  setUser: (user) => {
    set({ user });
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },
}));
