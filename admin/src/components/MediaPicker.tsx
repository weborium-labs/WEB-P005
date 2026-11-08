import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  TextField,
  Typography,
} from "@mui/material";
import { Delete as DeleteIcon, UploadFile as UploadIcon } from "@mui/icons-material";
import { getMedia, uploadMedia, deleteMedia } from "../api/media.api";
import { normalizeApiError, isRequestCanceled } from "../api/apiClient";
import type { MediaItem, SectionImage } from "../types/page";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const PAGE_SIZE = 24;

interface MediaPickerProps {
  open: boolean;
  value?: SectionImage;
  /** Called with the chosen asset, or `null` when the image is cleared. */
  onSelect: (image: SectionImage | null) => void;
  onClose: () => void;
}

/**
 * Media library picker: choose an existing Cloudinary asset, upload a new one,
 * or paste an absolute URL. Deleting an asset that a page still references is
 * refused by the backend, which this dialog surfaces as an error.
 */
export const MediaPicker = ({ open, value, onSelect, onClose }: MediaPickerProps) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [urlDraft, setUrlDraft] = useState(value?.url ?? "");
  const [urlError, setUrlError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (targetPage: number, signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMedia({ page: targetPage, limit: PAGE_SIZE }, signal);
      if (signal.aborted) return;
      setItems(response.items);
      setTotal(response.total);
    } catch (err) {
      if (isRequestCanceled(err)) return;
      setError(normalizeApiError(err).message);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    // Deferred so no state update happens synchronously in the effect body.
    queueMicrotask(() => {
      if (!controller.signal.aborted) void load(page, controller.signal);
    });
    return () => controller.abort();
  }, [open, page, load]);

  useEffect(() => {
    if (!open) return;
    // Deferred so no state update happens synchronously in the effect body.
    queueMicrotask(() => setUrlDraft(value?.url ?? ""));
  }, [open, value]);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Only image files (JPG, PNG, WEBP, GIF) are allowed.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("Image is too large. Maximum size is 10 MB.");
      return;
    }

    setBusy(true);
    setError(null);
    setProgress(0);
    try {
      const uploaded = await uploadMedia(file, setProgress);
      setItems((current) => [uploaded, ...current]);
      setTotal((current) => current + 1);
      onSelect({ url: uploaded.url, public_id: uploaded.public_id, alt: uploaded.alt });
      onClose();
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setBusy(false);
      setProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (item: MediaItem) => {
    setBusy(true);
    setError(null);
    try {
      await deleteMedia(item._id);
      setItems((current) => current.filter((entry) => entry._id !== item._id));
      setTotal((current) => Math.max(0, current - 1));
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const applyUrl = () => {
    const trimmed = urlDraft.trim();
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      setUrlError("Enter a valid http(s) URL.");
      return;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      setUrlError("Only http(s) URLs are allowed.");
      return;
    }
    setUrlError(null);
    onSelect({ url: trimmed, alt: value?.alt });
    onClose();
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>Choose an image</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", mb: 2 }}>
          <TextField
            label="Image URL"
            size="small"
            fullWidth
            value={urlDraft}
            onChange={(event) => {
              setUrlDraft(event.target.value);
              setUrlError(null);
            }}
            error={Boolean(urlError)}
            helperText={urlError ?? "Paste an absolute http(s) URL."}
          />
          <Button variant="outlined" onClick={applyUrl} sx={{ height: 40 }}>
            Use URL
          </Button>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="subtitle2">Media library ({total})</Typography>
          <Button
            size="small"
            startIcon={<UploadIcon />}
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload image
          </Button>
        </Box>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleUpload(file);
          }}
        />

        {progress !== null && <LinearProgress variant="determinate" value={progress} sx={{ mb: 1 }} />}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : items.length === 0 ? (
          <Alert severity="info">
            No images uploaded yet. Upload one or paste a URL above.
          </Alert>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 1.5,
            }}
          >
            {items.map((item) => (
              <Box
                key={item._id}
                sx={{
                  position: "relative",
                  border: "1px solid",
                  borderColor: value?.public_id === item.public_id ? "primary.main" : "divider",
                  borderRadius: 1,
                  overflow: "hidden",
                  background: "transparent",
                  lineHeight: 0,
                }}
              >
                <Box
                  component="img"
                  src={item.url}
                  alt={item.alt || "Media item"}
                  sx={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover" }}
                />
                {/* Full-tile select control sits *behind* the delete button so
                    no interactive element is ever nested inside another. */}
                <Button
                  type="button"
                  aria-label={`Select ${item.alt || "image"}`}
                  onClick={() => {
                    onSelect({ url: item.url, public_id: item.public_id, alt: item.alt });
                    onClose();
                  }}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    minWidth: 0,
                    minHeight: 0,
                    p: 0,
                    borderRadius: 0,
                  }}
                />
                <IconButton
                  size="small"
                  aria-label="Delete image"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleDelete(item);
                  }}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    zIndex: 2,
                    bgcolor: "rgba(255,255,255,0.9)",
                    "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                  }}
                >
                  <DeleteIcon fontSize="inherit" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        {pages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2, alignItems: "center" }}>
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
      </DialogContent>
      <DialogActions>
        {value && (
          <Button
            color="error"
            onClick={() => {
              onSelect(null);
              onClose();
            }}
          >
            Remove image
          </Button>
        )}
        <Button onClick={onClose} disabled={busy}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MediaPicker;
