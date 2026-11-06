import type { ReactNode } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useAuth } from "../store/auth.store";

const CenteredLoader = ({ label }: { label: string }) => (
  <Box
    sx={{
      minHeight: "60vh",
      display: "grid",
      placeItems: "center",
      gap: 2,
    }}
    role="status"
    aria-label={label}
  >
    <Stack spacing={2} sx={{ alignItems: "center" }}>
      <CircularProgress aria-label={label} />
      <Typography color="text.secondary">{label}</Typography>
    </Stack>
  </Box>
);

/**
 * Renders protected routes only after the backend authentication check has
 * completed. Unauthenticated visitors are sent to the sign-in entry point;
 * authenticated non-admins are denied.
 */
export const ProtectedRoute = () => {
  const isAuthChecked = useAuth((s) => s.isAuthChecked);
  const authState = useAuth((s) => s.authState);
  const user = useAuth((s) => s.user);

  if (!isAuthChecked) {
    return <CenteredLoader label="Checking your session…" />;
  }

  if (!authState) {
    return <Navigate to="/" replace />;
  }

  if (user && user.role !== "admin") {
    return <AccessDenied />;
  }

  return <Outlet />;
};

const AccessDenied = () => {
  const clearAuth = useAuth((s) => s.clearAuth);
  const navigate = useNavigate();

  const handleSignOut = () => {
    clearAuth();
    navigate("/", { replace: true });
  };

  return (
    <Stack
      sx={{ minHeight: "60vh", alignItems: "center", justifyContent: "center", gap: 2, px: 2 }}
      role="alert"
    >
      <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
        Admin access required
      </Typography>
      <Typography color="text.secondary" sx={{ textAlign: "center" }}>
        Your account is not authorized to view the administration panel.
      </Typography>
      <Button variant="outlined" onClick={handleSignOut}>
        Sign out
      </Button>
    </Stack>
  );
};

/**
 * Keeps already-authenticated admins away from the sign-in screens.
 */
export const GuestOnly = ({ children }: { children: ReactNode }) => {
  const isAuthChecked = useAuth((s) => s.isAuthChecked);
  const authState = useAuth((s) => s.authState);
  const user = useAuth((s) => s.user);

  if (!isAuthChecked) {
    return <CenteredLoader label="Checking your session…" />;
  }

  if (authState) {
    return user && user.role !== "admin" ? (
      <Navigate to="/?error=forbidden" replace />
    ) : (
      <Navigate to="/dashboard" replace />
    );
  }

  return children;
};
