import { create } from "zustand";

interface AuthDetails {
  accessToken: string;
  authState: boolean;
  isAuthChecked: boolean;
  setIsAuthChecked: (value: boolean) => void;
  setAuthState: (value: boolean) => void;
  setAccessToken: (value: string) => void;
}

export const useAuth = create<AuthDetails>((set) => ({
  accessToken: "token...",
  authState: false,
  isAuthChecked: false,
  setIsAuthChecked: (authChecked: boolean) =>
    set({ isAuthChecked: authChecked }),
  setAuthState: (authState: boolean) => set({ authState }),
  setAccessToken: (tokenValue: string) => set({ accessToken: tokenValue }),
}));
