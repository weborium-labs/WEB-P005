import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AddIcon from "@mui/icons-material/Add";
import {
  createPublications,
  deletePublication,
  getPublications,
  updatePublication,
  type Publication,
  type PublicationType,
} from "../api/publication.api";
import { isRequestCanceled, normalizeApiError } from "../api/apiClient";
import { useAuth } from "../store/auth.store";

type Feedback = { severity: "success" | "error"; message: string } | null;

// Validates with the platform URL parser instead of a regex so any valid
// http(s) URL is accepted (including dotless hosts like http://localhost:3000).
const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

interface PublicationFormState {
  open: boolean;
  mode: "create" | "edit";
  publicationId: string | null;
  type: PublicationType;
  title: string;
  year: string;
  publication_name: string;
  redirect_url: string;
  volume_issue: string;
  indexing: string;
  order: string;
}

const EMPTY_FORM: PublicationFormState = {
  open: false,
  mode: "create",
  publicationId: null,
  type: "journal",
  title: "",
  year: "",
  publication_name: "",
  redirect_url: "",
  volume_issue: "",
  indexing: "",
  order: "0",
};

const PublicationsPage = () => {
  const user = useAuth((s) => s.user);

  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const [form, setForm] = useState<PublicationFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Publication | null>(null);

  // Tracks the latest manual retry so it can be aborted on a newer retry or
  // when the page unmounts (the initial load is handled by the effect below).
  const retryControllerRef = useRef<AbortController | null>(null);

  const loadPublications = useCallback(async (signal: AbortSignal) => {
    try {
      // State updates happen only after the request settles so effects never
      // trigger synchronous cascading renders.
      const items = await getPublications(signal);
      setPublications(items);
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
        void loadPublications(controller.signal);
      }
    });
    return () => {
      controller.abort();
      retryControllerRef.current?.abort();
    };
  }, [loadPublications]);

  const loadSilently = async () => {
    try {
      const items = await getPublications();
      setPublications(items);
      setError(null);
    } catch (err) {
      if (!isRequestCanceled(err)) {
        setError(normalizeApiError(err).message);
      }
    }
  };

  const runMutation = async (mutation: () => Promise<string>): Promise<boolean> => {
    if (busy) return false;
    setBusy(true);

    try {
      const message = await mutation();
      setFeedback({ severity: "success", message });
      return true;
    } catch (err) {
      setFeedback({ severity: "error", message: normalizeApiError(err).message });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const openCreate = () => {
    setFormError(null);
    setForm({ ...EMPTY_FORM, open: true, mode: "create" });
  };

  const openEdit = (publication: Publication) => {
    setFormError(null);
    setForm({
      open: true,
      mode: "edit",
      publicationId: publication._id,
      type: publication.type,
      title: publication.title,
      year: String(publication.year ?? ""),
      publication_name: publication.publication_name,
      redirect_url: publication.redirect_url,
      volume_issue: publication.volume_issue ?? "",
      indexing: publication.indexing ?? "",
      order: String(publication.order ?? 0),
    });
  };

  const submitForm = async () => {
    const title = form.title.trim();
    const publicationName = form.publication_name.trim();
    const redirectUrl = form.redirect_url.trim();
    const year = Number(form.year);
    const order = Number(form.order);

    if (!title) return setFormError("Title is required.");
    if (!publicationName) return setFormError("Publication name is required.");
    if (!form.year || !Number.isInteger(year) || year < 1900 || year > 2100) {
      return setFormError("Enter a valid year (1900–2100).");
    }
    if (!redirectUrl || !isHttpUrl(redirectUrl)) {
      return setFormError("Redirect URL must be a valid http(s) URL.");
    }
    if (!Number.isFinite(order) || order < 0) {
      return setFormError("Order must be a non-negative number.");
    }
    if (form.mode === "create" && !user) {
      return setFormError("Your session could not be resolved. Please sign in again.");
    }

    const payload = {
      type: form.type,
      title,
      year,
      publication_name: publicationName,
      redirect_url: redirectUrl,
      volume_issue: form.volume_issue.trim(),
      indexing: form.indexing.trim(),
      order,
      ...(form.mode === "create" && user ? { user_id: user._id } : {}),
    };

    const ok = await runMutation(async () => {
      if (form.mode === "create") {
        await createPublications(payload);
      } else {
        await updatePublication(form.publicationId!, payload);
      }
      await loadSilently();
      return form.mode === "create" ? "Publication created." : "Publication updated.";
    });

    if (ok) {
      setForm(EMPTY_FORM);
      setFormError(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);

    await runMutation(async () => {
      await deletePublication(target._id);
      await loadSilently();
      return "Publication deleted.";
    });
  };

  return (
    <Stack spacing={3} sx={{ py: 1 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Publications
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage journal and conference publication records.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} disabled={busy}>
          Add publication
        </Button>
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
                void loadPublications(controller.signal);
              }}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading && publications.length === 0 && !error && (
        <Box sx={{ display: "grid", placeItems: "center", py: 6 }} role="status">
          <CircularProgress aria-label="Loading publications…" />
        </Box>
      )}

      {!loading && !error && publications.length === 0 && (
        <Alert severity="info">No publications yet. Add the first one to get started.</Alert>
      )}

      {publications.length > 0 && (
        <Card elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Year</TableCell>
                  <TableCell>Publication</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {publications.map((publication) => (
                  <TableRow key={publication._id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {publication.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={publication.type} />
                    </TableCell>
                    <TableCell>{publication.year}</TableCell>
                    <TableCell>{publication.publication_name}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        aria-label={`Edit ${publication.title}`}
                        onClick={() => openEdit(publication)}
                        disabled={busy}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label={`Delete ${publication.title}`}
                        onClick={() => setDeleteTarget(publication)}
                        disabled={busy}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Create/edit dialog */}
      <Dialog open={form.open} onClose={() => setForm(EMPTY_FORM)} fullWidth maxWidth="sm">
        <DialogTitle>
          {form.mode === "create" ? "Add publication" : "Edit publication"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              fullWidth
              required
              autoFocus
              disabled={busy}
            />
            <TextField
              label="Publication name"
              value={form.publication_name}
              onChange={(e) => setForm((f) => ({ ...f, publication_name: e.target.value }))}
              fullWidth
              required
              disabled={busy}
              helperText="Journal or conference name."
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Type"
                select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PublicationType }))}
                fullWidth
                disabled={busy}
              >
                <MenuItem value="journal">journal</MenuItem>
                <MenuItem value="conference">conference</MenuItem>
              </TextField>
              <TextField
                label="Year"
                type="number"
                slotProps={{ htmlInput: { min: 1900, max: 2100 } }}
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                fullWidth
                required
                disabled={busy}
              />
              <TextField
                label="Order"
                type="number"
                slotProps={{ htmlInput: { min: 0 } }}
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                fullWidth
                disabled={busy}
              />
            </Stack>
            <TextField
              label="Redirect URL"
              value={form.redirect_url}
              onChange={(e) => setForm((f) => ({ ...f, redirect_url: e.target.value }))}
              fullWidth
              required
              disabled={busy}
              placeholder="https://…"
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Volume / Issue"
                value={form.volume_issue}
                onChange={(e) => setForm((f) => ({ ...f, volume_issue: e.target.value }))}
                fullWidth
                disabled={busy}
              />
              <TextField
                label="Indexing"
                value={form.indexing}
                onChange={(e) => setForm((f) => ({ ...f, indexing: e.target.value }))}
                fullWidth
                disabled={busy}
                helperText="e.g. SCI, Scopus, EI"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForm(EMPTY_FORM)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void submitForm()} variant="contained" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Delete &quot;{deleteTarget?.title}&quot;? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void confirmDelete()} color="error" variant="contained" disabled={busy}>
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

export default PublicationsPage;
