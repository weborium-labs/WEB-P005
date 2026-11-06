import { CircularProgress, Stack, Typography } from "@mui/material";
import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../store/auth.store";
import { fetchSession } from "../../api/auth.api";

/**
 * Receives the temporary access token from the OAuth callback redirect,
 * stores it in memory, verifies it against the backend, and cleans the
 * token out of the URL.
 */
const TokenCapture = () => {
  const setToken = useAuth((s) => s.setAccessToken);
  const setUser = useAuth((s) => s.setUser);
  const clearAuth = useAuth((s) => s.clearAuth);
  const setIsAuthChecked = useAuth((s) => s.setIsAuthChecked);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    if (!token) {
      // Deep link without a temporary token: return to the sign-in entry
      // point and let the bootstrap auth check decide what to show.
      navigate("/", { replace: true });
      return;
    }

    startedRef.current = true;
    setToken(token);

    // Remove the temporary token from the URL immediately so it does not
    // linger in browser history or the address bar.
    navigate("/verify-token", { replace: true });

    const verify = async (): Promise<void> => {
      try {
        // Never trust the token from the URL alone: verify it against the
        // backend, which validates it and returns the authoritative role.
        const user = await fetchSession();

        if (user.role !== "admin") {
          clearAuth();
          navigate("/?error=forbidden", { replace: true });
          return;
        }

        setUser(user);
        setIsAuthChecked(true);
        navigate("/dashboard", { replace: true });
      } catch {
        clearAuth();
        navigate("/", { replace: true });
      }
    };

    void verify();
  }, [token, clearAuth, navigate, setIsAuthChecked, setUser, setToken]);

  return (
    <Stack
      sx={{
        minHeight: "60vh",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        px: 2,
      }}
      role="status"
      aria-label="Verifying your sign-in"
    >
      <CircularProgress aria-label="Verifying your sign-in…" />
      <Typography color="text.secondary">Verifying your sign-in…</Typography>
    </Stack>
  );
};

export default TokenCapture;
