import { create } from "zustand";

export interface AuthUser {
  _id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  role: "user" | "admin";
}

interface AuthDetails {
  accessToken: string | null;
  authState: boolean;
  isAuthChecked: boolean;
  user: AuthUser | null;

  setIsAuthChecked: (value: boolean) => void;
  setAuthState: (value: boolean) => void;
  setAccessToken: (value: string | null) => void;
  setUser: (value: AuthUser | null) => void;
  clearAuth: () => void;
}

export const useAuth = create<AuthDetails>((set) => ({
  accessToken: null,
  authState: false,
  isAuthChecked: false,
  user: null,

  setIsAuthChecked: (value) => set({ isAuthChecked: value }),

  setAuthState: (value) => set({ authState: value }),

  setAccessToken: (value) =>
    set({
      accessToken: value,
      authState: Boolean(value),
    }),

  setUser: (value) => set({ user: value }),

  clearAuth: () =>
    set({
      accessToken: null,
      authState: false,
      isAuthChecked: true,
      user: null,
    }),
}));
