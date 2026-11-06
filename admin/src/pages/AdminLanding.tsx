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

const AdminLanding = () => {
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [searchParams] = useSearchParams();
    const accessDenied = searchParams.get("error") === "forbidden";

    /**
     * Authentication entry point: redirects to the existing backend
     * Google OAuth route (`/api/v1/user/auth/google`).
     */
    const handleGoogleSignIn = async (): Promise<void> => {
        setIsSigningIn(true);
        startGoogleSignIn();
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
                <Stack sx={{ wordSpacing: 3, alignItems: 'stretch' }}>
                    <Box>
                        <Typography
                            variant="h5"
                            component="h1"
                            sx={{ fontWeight: 700 }}
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

                    {accessDenied && (
                        <Alert severity="error" role="alert">
                            Your Google account does not have admin access to this panel.
                        </Alert>
                    )}

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