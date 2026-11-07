import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getOverviewStats } from "../api/stats.api";
import { isRequestCanceled, normalizeApiError } from "../api/apiClient";
import type { OverviewStats } from "../types/page";

/**
 * Dashboard overview.
 *
 * Every figure comes straight from `GET /api/v1/stats/overview`, which counts
 * the real MongoDB collections — nothing is derived or fabricated client-side.
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tracks the latest manual retry so it can be aborted on a newer retry or
  // when the page unmounts (the initial load is handled by the effect below).
  const retryControllerRef = useRef<AbortController | null>(null);

  const loadStats = useCallback(async (signal: AbortSignal) => {
    try {
      // No synchronous setState here: state updates happen only after the
      // request settles, which keeps effect execution free of cascading
      // renders (react-hooks/set-state-in-effect).
      const overview = await getOverviewStats(signal);
      setStats(overview);
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
        void loadStats(controller.signal);
      }
    });
    return () => {
      controller.abort();
      retryControllerRef.current?.abort();
    };
  }, [loadStats]);

  const cards: {
    title: string;
    count: number | undefined;
    path: string;
    description: string;
  }[] = [
    {
      title: "Pages",
      count: stats?.pages.total,
      path: "/dashboard/pages",
      description: "Document-level content: hero, sections, SEO and status.",
    },
    {
      title: "Navigation",
      count: stats ? stats.navigation.navbars + stats.navigation.subnavbars : undefined,
      path: "/dashboard/navbars",
      description: "Manage top-level menu items and nested sub-navigation.",
    },
    {
      title: "Publications",
      count: stats?.publications,
      path: "/dashboard/publications",
      description: "Manage journal and conference publication records.",
    },
    {
      title: "Glimpses",
      count: stats?.glimpses,
      path: "/dashboard/glimpses",
      description: "Upload and remove gallery images.",
    },
    {
      title: "Media",
      count: stats?.media,
      path: "/dashboard/media",
      description: "Cloudinary-backed images used across page content.",
    },
  ];

  const statusChips = stats ? (
    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
      <Chip size="small" color="success" variant="outlined" label={`${stats.pages.published} published`} />
      <Chip size="small" variant="outlined" label={`${stats.pages.draft} draft`} />
    </Stack>
  ) : null;

  return (
    <Stack spacing={3} sx={{ py: 1 }}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Overview of your portfolio content.
        </Typography>
        {statusChips}
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
                void loadStats(controller.signal);
              }}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading && !stats && !error && (
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

      {/* Recently updated pages — real `updatedAt` values from the database. */}
      <Card elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Recently updated pages
          </Typography>
          {!stats || stats.recentlyUpdated.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {loading ? "Loading…" : "No pages have been edited yet."}
            </Typography>
          ) : (
            <Box sx={{ mt: 1, display: "grid", gap: 1 }}>
              {stats.recentlyUpdated.map((page) => (
                <Box
                  key={page._id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {page.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                      /{page.slug} · v{page.version}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Chip
                      size="small"
                      label={page.status}
                      color={page.status === "published" ? "success" : "default"}
                      variant={page.status === "published" ? "filled" : "outlined"}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(page.updatedAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </Typography>
                    <Button size="small" onClick={() => navigate(`/dashboard/pages/${page.slug}`)}>
                      Edit
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};

export default Dashboard;
