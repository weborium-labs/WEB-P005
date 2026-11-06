import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { useSearchParams } from "react-router-dom";
import { startGoogleSignIn } from "../api/auth.api";

/**
 * Sign-in screen for the admin panel. Authentication is Google OAuth only
 * (handled by the existing backend Passport flow) — there is no
 * email/password authentication in this application.
 */
const SignIn = () => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [searchParams] = useSearchParams();
  const accessDenied = searchParams.get("error") === "forbidden";

  const handleGoogleSignIn = (): void => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    startGoogleSignIn();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        bgcolor: "background.default",
      }}
    >
      <Paper
        component="main"
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: { xs: 3, sm: 4 },
          border: 1,
          borderColor: "divider",
          borderRadius: 3,
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography
              variant="h5"
              component="h1"
              sx={{ fontWeight: 700 }}
            >
              Welcome back
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              Sign in to continue to the administration panel.
            </Typography>
          </Box>

          {accessDenied && (
            <Alert severity="error" role="alert">
              Your Google account does not have admin access to this panel.
            </Alert>
          )}

          <Button
            type="button"
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            sx={{
              minHeight: 48,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {isSigningIn ? "Redirecting..." : "Continue with Google"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default SignIn;
