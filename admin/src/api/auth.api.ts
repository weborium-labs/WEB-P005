import apiClient, { refreshAccessToken } from "./apiClient";
import { useAuth, type AuthUser } from "../store/auth.store";

/**
 * Redirects the browser to the existing backend Google OAuth entry point.
 */
export const startGoogleSignIn = (): void => {
  window.location.assign(import.meta.env.VITE_GOOGLE_REDIRECT_URL);
};

/**
 * Verifies the current access token against the backend and returns the
 * authoritative profile (including `role` from the database).
 */
export const fetchSession = async (): Promise<AuthUser> => {
  const response = await apiClient.get<{ data: AuthUser }>(
    "/user/auth/session",
  );
  return response.data.data;
};

/**
 * Asks the backend to clear the HttpOnly refresh-token cookie. Failures are
 * tolerated: local sign-out proceeds either way (the cookie may already be
 * gone or expired).
 */
export const logoutRequest = async (): Promise<void> => {
  try {
    await apiClient.post("/user/auth/logout");
  } catch {
    // Intentionally ignored — local state is cleared regardless.
  }
};

const applyVerifiedSession = (user: AuthUser): void => {
  const { setUser, setIsAuthChecked, clearAuth } = useAuth.getState();

  if (user.role !== "admin") {
    // Backend-verified non-admin: deny admin access.
    clearAuth();
    if (!window.location.search.includes("error=forbidden")) {
      window.location.replace("/?error=forbidden");
    }
    return;
  }

  setUser(user);
  setIsAuthChecked(true);
};

const runInitializeAuth = async (): Promise<void> => {
  if (useAuth.getState().isAuthChecked) {
    return;
  }

  // The token-capture flow owns authentication for this page load; let it
  // finish instead of racing it with a refresh.
  const params = new URLSearchParams(window.location.search);
  const hasPendingCapture =
    window.location.pathname.startsWith("/verify-token") &&
    params.has("token");
  if (hasPendingCapture) {
    return;
  }

  try {
    // A token is already in memory (captured earlier in this session).
    if (useAuth.getState().accessToken) {
      const user = await fetchSession();
      applyVerifiedSession(user);
      return;
    }

    // Cold load / browser refresh: restore the session from the
    // HttpOnly refresh-token cookie.
    const token = await refreshAccessToken();
    if (!token) {
      useAuth.getState().clearAuth();
      return;
    }

    const user = await fetchSession();
    applyVerifiedSession(user);
  } catch {
    useAuth.getState().clearAuth();
  }
};

let initializePromise: Promise<void> | null = null;

/**
 * Restores authentication on application load. Single-flight: StrictMode
 * double-mounts and concurrent callers share one run.
 */
export const initializeAuth = (): Promise<void> => {
  if (!initializePromise) {
    initializePromise = runInitializeAuth().catch(() => {
      useAuth.getState().clearAuth();
    });
  }

  return initializePromise;
};
