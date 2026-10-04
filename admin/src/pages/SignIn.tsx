import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

interface SignInForm {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const INITIAL_FORM: SignInForm = {
  email: "",
  password: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateForm = (form: SignInForm): FormErrors => {
  const errors: FormErrors = {};
  const email = form.email.trim();

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!form.password) {
    errors.password = "Password is required.";
  }

  return errors;
};

const SignIn = () => {
  const [form, setForm] = useState<SignInForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleChange = (field: keyof SignInForm, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));

    if (formError) {
      setFormError("");
    }
  };

  const submitSignIn = async () => {
    const normalizedEmail = form.email.trim().toLowerCase();

    const payload: SignInForm = {
      email: normalizedEmail,
      password: form.password,
    };

    // TODO: Replace with your authentication service.
    // await authService.signIn(payload);

    console.log(payload);
  };

  const handleSubmit = async (event: Parameters<
    React.FormEventHandler<HTMLFormElement>
  >[0]) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateForm(form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      await submitSignIn();
    } catch {
      setFormError("Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    // TODO: Replace with your backend OAuth endpoint.
    // window.location.assign(`${import.meta.env.VITE_API_URL}/auth/google`);
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
            <Typography variant="h5" fontWeight={700}>
              Welcome back
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              Sign in to continue to your account.
            </Typography>
          </Box>

          {formError && (
            <Alert severity="error" role="alert">
              {formError}
            </Alert>
          )}

          <Button
            type="button"
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            sx={{
              minHeight: 48,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Continue with Google
          </Button>

          <Divider>
            <Typography variant="caption" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            autoComplete="on"
          >
            <Stack spacing={2}>
              <TextField
                fullWidth
                required
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  handleChange("email", event.target.value)
                }
                error={Boolean(errors.email)}
                helperText={errors.email}
                autoComplete="email"
                autoFocus
                disabled={isSubmitting}
              />

              <TextField
                fullWidth
                required
                label="Password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  handleChange("password", event.target.value)
                }
                error={Boolean(errors.password)}
                helperText={errors.password}
                autoComplete="current-password"
                disabled={isSubmitting}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                disabled={isSubmitting}
                sx={{
                  minHeight: 48,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </Stack>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center" }}
          >
            Don't have an account?{" "}
            <Link
              href="/signup"
              underline="none"
              color="primary"
              sx={{ fontWeight: 600 }}
            >
              Sign up
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default SignIn;