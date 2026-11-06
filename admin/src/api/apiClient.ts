import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuth } from "../store/auth.store";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5500/api/v1";

const REFRESH_ENDPOINT = "/user/auth/refresh-token";

export interface ApiErrorBody {
  statusCode: number;
  success: boolean;
  message: string;
  errors?: { field?: string; message: string }[];
}

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Attach the latest access token to every request.
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = useAuth.getState().accessToken;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      delete config.headers.Authorization;
    }

    // Multipart bodies must not carry a forced JSON content type, otherwise
    // axios would serialize the FormData and the browser could not set the
    // multipart boundary.
    if (config.data instanceof FormData) {
      config.headers.delete("Content-Type");
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Single-flight access-token refresh
// ---------------------------------------------------------------------------

let refreshPromise: Promise<string | null> | null = null;

const performTokenRefresh = async (): Promise<string | null> => {
  try {
    // Deliberately uses a bare axios call so the refresh stays isolated from
    // the response-interceptor retry cycle below (no recursion, no auth
    // header). withCredentials sends the HttpOnly refresh-token cookie.
    const response = await axios.post<{
      statusCode: number;
      data?: { accessToken?: string };
    }>(
      `${API_BASE_URL}${REFRESH_ENDPOINT}`,
      {},
      {
        withCredentials: true,
        timeout: 15000,
        headers: { Accept: "application/json" },
      },
    );

    const token = response.data?.data?.accessToken;
    if (!token) {
      return null;
    }

    useAuth.getState().setAccessToken(token);
    return token;
  } catch {
    return null;
  }
};

/**
 * Refreshes the access token. Concurrent callers share one in-flight
 * refresh request; the promise is cleared once settled so the next expiry
 * can trigger a fresh refresh.
 */
export const refreshAccessToken = (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

// ---------------------------------------------------------------------------
// Response interceptor: one automatic retry after a successful refresh
// ---------------------------------------------------------------------------

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as RetriableRequestConfig | undefined;
    const isRefreshCall = original?.url?.includes(REFRESH_ENDPOINT) ?? false;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isRefreshCall
    ) {
      original._retry = true;

      const newToken = await refreshAccessToken();

      // Retry the original request exactly once; the request interceptor
      // attaches the newly issued token from Zustand.
      if (newToken) {
        return apiClient(original);
      }

      // Refresh failed: clear the session and return to the sign-in entry
      // point unless we are already there.
      useAuth.getState().clearAuth();

      const path = window.location.pathname;
      if (path !== "/" && path !== "/auth/signIn") {
        window.location.replace("/");
      }
    }

    return Promise.reject(error);
  },
);

// ---------------------------------------------------------------------------
// Error normalization
// ---------------------------------------------------------------------------

export interface NormalizedApiError {
  status: number | null;
  message: string;
  errors: { field?: string; message: string }[];
  isNetworkError: boolean;
}

export const normalizeApiError = (error: unknown): NormalizedApiError => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (error.response) {
      const body = error.response.data;
      return {
        status: error.response.status,
        message:
          typeof body?.message === "string" && body.message
            ? body.message
            : `Request failed with status ${error.response.status}.`,
        errors: Array.isArray(body?.errors) ? body.errors : [],
        isNetworkError: false,
      };
    }

    if (error.code === "ECONNABORTED") {
      return {
        status: null,
        message: "The request timed out. Please try again.",
        errors: [],
        isNetworkError: true,
      };
    }

    return {
      status: null,
      message: "Unable to reach the server. Check your connection and try again.",
      errors: [],
      isNetworkError: true,
    };
  }

  return {
    status: null,
    message: error instanceof Error ? error.message : "Something went wrong.",
    errors: [],
    isNetworkError: false,
  };
};

export const isRequestCanceled = (error: unknown): boolean =>
  axios.isCancel(error);

export default apiClient;
