import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  DeleteOutlined as DeleteOutlineIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import { deleteMedia, getMedia, uploadMedia } from "../api/media.api";
import { isRequestCanceled, normalizeApiError } from "../api/apiClient";
import ConfirmDialog from "../components/ConfirmDialog";
import FeedbackSnackbar, { type Feedback } from "../components/FeedbackSnackbar";
import type { MediaItem } from "../types/page";

const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const PAGE_SIZE = 24;

/**
 * Admin media library: browse, upload and delete Cloudinary-backed images.
 * Deletion is refused by the backend while any page still references the
 * asset, which is surfaced here as an inline error rather than a silent no-op.
 */
export const MediaPage = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (targetPage: number, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMedia({ page: targetPage, limit: PAGE_SIZE }, signal);
      if (signal?.aborted) return;
      setItems(response.items);
      setTotal(response.total);
      setPages(response.pages);
      setPage(response.page);
    } catch (err) {
      if (isRequestCanceled(err)) return;
      setError(normalizeApiError(err).message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(page, controller.signal);
    return () => controller.abort();
  }, [load, page]);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    if (files.length > MAX_FILES) {
      setError(`You can upload at most ${MAX_FILES} images at once.`);
      return;
    }

    const invalid = files.find(
      (file) => !file.type.startsWith("image/") || file.size > MAX_FILE_SIZE_BYTES,
    );
    if (invalid) {
      setError(
        invalid.size > MAX_FILE_SIZE_BYTES
          ? "Image is too large. Maximum size is 10 MB."
          : "Only image files (JPG, PNG, WEBP, GIF) are allowed.",
      );
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const uploaded: MediaItem[] = [];
      for (const [index, file] of files.entries()) {
        const result = await uploadMedia(file, (percent) =>
          setProgress(Math.round(((index + percent / 100) / files.length) * 100)),
        );
        uploaded.push(result);
      }
      setItems((current) => [...uploaded, ...current]);
      setTotal((current) => current + uploaded.length);
      setFeedback({
        severity: "success",
        message: `${uploaded.length} image(s) uploaded.`,
      });
      setUploadOpen(false);
      if (page !== 1) setPage(1);
      else void load(1);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setBusy(false);
      setProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await deleteMedia(deleteTarget._id);
      setItems((current) => current.filter((entry) => entry._id !== deleteTarget._id));
      setTotal((current) => Math.max(0, current - 1));
      setFeedback({ severity: "success", message: "Image deleted." });
      setDeleteTarget(null);
    } catch (err) {
      setFeedback({ severity: "error", message: normalizeApiError(err).message });
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Media library
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {total} image{total === 1 ? "" : "s"} stored in Cloudinary.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setUploadOpen(true)}>
          Upload images
        </Button>
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          void handleFiles(files);
        }}
      />

      {progress !== null && <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={28} />
            </Box>
          ) : items.length === 0 ? (
            <Alert severity="info">
              No images yet. Upload one to use it in hero sections, page content or galleries.
            </Alert>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 2,
              }}
            >
              {items.map((item) => (
                <Box key={item._id}>
                  <Box
                    component="img"
                    src={item.url}
                    alt={item.alt || "Media item"}
                    sx={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      objectFit: "cover",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  />
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: "60%" }}>
                      {item.format || "image"} · {Math.max(1, Math.round(item.bytes / 1024))} KB
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        aria-label="Open image in a new tab"
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <OpenInNewIcon fontSize="inherit" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label="Delete image"
                        color="error"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <DeleteOutlineIcon fontSize="inherit" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {pages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mt: 3 }}>
              <Button size="small" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Typography variant="body2">
                {page} / {pages}
              </Typography>
              <Button
                size="small"
                disabled={page >= pages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload images</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "16px !important" }}>
          <Alert severity="info">
            JPG, PNG, WEBP or GIF · up to {MAX_FILES} files · 10 MB each.
          </Alert>
          <Button variant="outlined" disabled={busy} onClick={() => fileInputRef.current?.click()}>
            Choose files
          </Button>
          {progress !== null && <LinearProgress variant="determinate" value={progress} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)} disabled={busy}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete image?"
        message="The image will be removed from Cloudinary and the library. If a page still uses it, the request will be refused."
        busy={busy}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <FeedbackSnackbar feedback={feedback} onClose={() => setFeedback(null)} />
    </Box>
  );
};

export default MediaPage;
