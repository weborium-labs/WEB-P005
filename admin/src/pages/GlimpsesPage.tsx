import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import {
  deleteGlimpse,
  getGlimpses,
  uploadGlimpses,
  type Glimpse,
} from "../api/glimpse.api";
import { isRequestCanceled, normalizeApiError } from "../api/apiClient";

type Feedback = { severity: "success" | "error"; message: string } | null;

const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // matches backend Multer limit

const GlimpsesPage = () => {
  const [glimpses, setGlimpses] = useState<Glimpse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [deleteTarget, setDeleteTarget] = useState<Glimpse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tracks the latest manual retry so it can be aborted on a newer retry or
  // when the page unmounts (the initial load is handled by the effect below).
  const retryControllerRef = useRef<AbortController | null>(null);

  const loadGlimpses = useCallback(async (signal: AbortSignal) => {
    try {
      // State updates happen only after the request settles so effects never
      // trigger synchronous cascading renders.
      const items = await getGlimpses(signal);
      setGlimpses(items);
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
        void loadGlimpses(controller.signal);
      }
    });
    return () => {
      controller.abort();
      retryControllerRef.current?.abort();
    };
  }, [loadGlimpses]);

  const loadSilently = async () => {
    try {
      const items = await getGlimpses();
      setGlimpses(items);
      setError(null);
    } catch (err) {
      if (!isRequestCanceled(err)) {
        setError(normalizeApiError(err).message);
      }
    }
  };

  const handleFileSelection = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const files = Array.from(event.target.files ?? []);
    // Allow re-selecting the same files after a failure.
    event.target.value = "";

    if (files.length === 0) return;

    if (files.length > MAX_FILES) {
      setFeedback({
        severity: "error",
        message: `You can upload at most ${MAX_FILES} images at once.`,
      });
      return;
    }

    const oversized = files.find((file) => file.size > MAX_FILE_SIZE_BYTES);
    if (oversized) {
      setFeedback({
        severity: "error",
        message: `"${oversized.name}" exceeds the 10 MB per-file limit.`,
      });
      return;
    }

    const nonImage = files.find((file) => !file.type.startsWith("image/"));
    if (nonImage) {
      setFeedback({
        severity: "error",
        message: `"${nonImage.name}" is not an image file.`,
      });
      return;
    }

    if (busy) return;
    setBusy(true);
    setUploadProgress(0);
    setError(null);

    try {
      const result = await uploadGlimpses(files, setUploadProgress);
      setFeedback({ severity: "success", message: result.message });
      await loadSilently();
    } catch (err) {
      setFeedback({ severity: "error", message: normalizeApiError(err).message });
    } finally {
      setBusy(false);
      setUploadProgress(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || busy) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setBusy(true);

    try {
      await deleteGlimpse(target._id);
      setFeedback({ severity: "success", message: "Image deleted." });
      await loadSilently();
    } catch (err) {
      setFeedback({ severity: "error", message: normalizeApiError(err).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={3} sx={{ py: 1 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Glimpses
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Upload and manage gallery images ({glimpses.length}/5 per batch, up to 10 MB each).
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddPhotoAlternateIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
        >
          {busy ? "Uploading…" : "Upload images"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => void handleFileSelection(event)}
          aria-label="Select images to upload"
        />
      </Box>

      {uploadProgress !== null && (
        <Box role="status" aria-label={`Upload progress: ${uploadProgress}%`}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="caption" color="text.secondary">
            Uploading… {uploadProgress}%
          </Typography>
        </Box>
      )}

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
                void loadGlimpses(controller.signal);
              }}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading && glimpses.length === 0 && !error && (
        <Box sx={{ display: "grid", placeItems: "center", py: 6 }} role="status">
          <CircularProgress aria-label="Loading glimpses…" />
        </Box>
      )}

      {!loading && !error && glimpses.length === 0 && (
        <Alert severity="info">No images yet. Upload the first batch to get started.</Alert>
      )}

      {glimpses.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "repeat(auto-fill, minmax(150px, 1fr))",
            },
          }}
        >
          {glimpses.map((glimpse) => (
            <Card
              key={glimpse._id}
              elevation={0}
              sx={{ border: 1, borderColor: "divider", borderRadius: 2, position: "relative", overflow: "hidden" }}
            >
              <Box
                component="img"
                src={glimpse.image_url}
                alt="Glimpse"
                loading="lazy"
                sx={{ width: "100%", height: 150, objectFit: "cover", display: "block" }}
              />
              <Stack
                direction="row"
                sx={{ alignItems: "center", justifyContent: "space-between", px: 1, py: 0.5 }}
              >
                <Typography variant="caption" color="text.secondary" noWrap>
                  #{glimpse.order ?? 0}
                </Typography>
                <IconButton
                  size="small"
                  aria-label="Delete image"
                  onClick={() => setDeleteTarget(glimpse)}
                  disabled={busy}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Card>
          ))}
        </Box>
      )}

      {/* Delete confirmation */}
      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Delete this image? It will be permanently removed from storage.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void handleDelete()} color="error" variant="contained" disabled={busy}>
            {busy ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={feedback !== null}
        autoHideDuration={4000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {feedback ? (
          <Alert severity={feedback.severity} variant="filled" onClose={() => setFeedback(null)}>
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Stack>
  );
};

export default GlimpsesPage;
