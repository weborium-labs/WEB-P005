import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getNavbars } from "../api/navbar.api";
import { getPublications } from "../api/publication.api";
import { getGlimpses } from "../api/glimpse.api";
import { isRequestCanceled, normalizeApiError } from "../api/apiClient";

interface OverviewCounts {
  navbars: number;
  publications: number;
  glimpses: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<OverviewCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tracks the latest manual retry so it can be aborted on a newer retry or
  // when the page unmounts (the initial load is handled by the effect below).
  const retryControllerRef = useRef<AbortController | null>(null);

  const loadCounts = useCallback(async (signal: AbortSignal) => {
    try {
      // No synchronous setState here: state updates happen only after the
      // requests settle, which keeps effect execution free of cascading
      // renders (react-hooks/set-state-in-effect).
      const [navbars, publications, glimpses] = await Promise.all([
        getNavbars(signal),
        getPublications(signal),
        getGlimpses(signal),
      ]);

      setCounts({
        navbars: navbars.length,
        publications: publications.length,
        glimpses: glimpses.length,
      });
      setError(null);
    } catch (err) {
      if (isRequestCanceled(err)) return;
      setError(normalizeApiError(err).message);
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Defer the initial fetch to a microtask: no React state is updated
    // synchronously while the effect runs (react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        void loadCounts(controller.signal);
      }
    });
    return () => {
      controller.abort();
      retryControllerRef.current?.abort();
    };
  }, [loadCounts]);

  const cards: {
    title: string;
    count: number | undefined;
    path: string;
    description: string;
  }[] = [
    {
      title: "Navigation",
      count: counts?.navbars,
      path: "/dashboard/navbars",
      description: "Manage top-level menu items and nested sub-navigation.",
    },
    {
      title: "Publications",
      count: counts?.publications,
      path: "/dashboard/publications",
      description: "Manage journal and conference publication records.",
    },
    {
      title: "Glimpses",
      count: counts?.glimpses,
      path: "/dashboard/glimpses",
      description: "Upload and remove gallery images.",
    },
  ];

  return (
    <Stack spacing={3} sx={{ py: 1 }}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Overview of your portfolio content.
        </Typography>
      </Box>

      {error && (
        <Alert
          severity="error"
          role="alert"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                retryControllerRef.current?.abort();
                const controller = new AbortController();
                retryControllerRef.current = controller;
                setLoading(true);
                setError(null);
                void loadCounts(controller.signal);
              }}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading && !counts && !error && (
        <Box sx={{ display: "grid", placeItems: "center", py: 6 }} role="status">
          <CircularProgress aria-label="Loading dashboard…" />
        </Box>
      )}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
        }}
      >
        {cards.map((card) => (
          <Card key={card.title} elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                {card.title}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                {card.count ?? "–"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {card.description}
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => navigate(card.path)}>
                Manage
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
    </Stack>
  );
};

export default Dashboard;
