import { useState } from "react";
import {
    Box,
    Button,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

const AdminLanding = () => {
    const [isSigningIn, setIsSigningIn] = useState(false);

    /**
     * Authentication entry point.
     *
     * Replace the implementation with your actual Google OAuth flow,
     * API call, redirect handler, or authentication service.
     */
    const handleGoogleSignIn = async (): Promise<void> => {
        // TODO: Call your Google authentication function here.
        // Example:
        // await authService.signInWithGoogle();

        setIsSigningIn(true);
    };

    return (
        <Box
            component="main"
            sx={{
                minHeight: "100vh",
                display: "grid",
                placeItems: "center",
                px: 2,
                py: 4,
                bgcolor: "background.default",
            }}
        >
            <Paper
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
                <Stack spacing={3} alignItems="stretch">
                    <Box>
                        <Typography
                            variant="h5"
                            component="h1"
                            fontWeight={700}
                        >
                            Admin Panel
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.75 }}
                        >
                            Sign in with your Google account to access the
                            administration panel.
                        </Typography>
                    </Box>

                    <Button
                        type="button"
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={<GoogleIcon />}
                        onClick={() => {
                            void handleGoogleSignIn();
                        }}
                        disabled={isSigningIn}
                        aria-label="Sign in to the admin panel with Google"
                        sx={{
                            minHeight: 48,
                            textTransform: "none",
                            fontWeight: 600,
                        }}
                    >
                        {isSigningIn
                            ? "Redirecting..."
                            : "Sign in with Google"}
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
};

export default AdminLanding;