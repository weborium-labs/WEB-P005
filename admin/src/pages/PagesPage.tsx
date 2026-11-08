import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add as AddIcon, DeleteOutlined as DeleteOutlineIcon, Edit as EditIcon } from "@mui/icons-material";
import { createPage, deletePage, getPages } from "../api/page.api";
import { isRequestCanceled, normalizeApiError } from "../api/apiClient";
import ConfirmDialog from "../components/ConfirmDialog";
import FeedbackSnackbar, { type Feedback } from "../components/FeedbackSnackbar";
import type { Page, PageStatus } from "../types/page";

interface CreateFormState {
  slug: string;
  title: string;
  status: PageStatus;
}

const EMPTY_FORM: CreateFormState = { slug: "", title: "", status: "draft" };

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Page document index: list, search/filter, create and delete. Editing happens
 * on the dedicated full-document editor route so the stable `_id` is always
 * carried across navigation.
 */
export const PagesPage = () => {
  const navigate = useNavigate();

  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PageStatus>("all");

  const [createForm, setCreateForm] = useState<CreateFormState>(EMPTY_FORM);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPages(signal);
      if (signal?.aborted) return;
      setPages(data);
    } catch (err) {
      if (isRequestCanceled(err)) return;
      setError(normalizeApiError(err).message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Deferred so no state update happens synchronously in the effect body.
    queueMicrotask(() => {
      if (!controller.signal.aborted) void load(controller.signal);
    });
    return () => controller.abort();
  }, [load]);

  const validateCreate = (): string | null => {
    const { slug, title } = createForm;
    if (!title.trim()) return "Page title is required.";
    if (!slug.trim()) return "Slug is required.";
    if (!SLUG_PATTERN.test(slug)) return "Lowercase letters, numbers and hyphens only.";
    if (pages.some((page) => page.slug === slug)) return "A page with this slug already exists.";
    return null;
  };

  const submitCreate = async () => {
    const validationError = validateCreate();
    if (validationError) {
      setCreateError(validationError);
      return;
    }

    setBusy(true);
    setCreateError(null);
    try {
      const created = await createPage({
        slug: createForm.slug.trim(),
        title: createForm.title.trim(),
        status: createForm.status,
        content: { sections: [] },
        seo: {},
      });
      setPages((current) => [...current, created].sort((a, b) => a.slug.localeCompare(b.slug)));
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      setFeedback({ severity: "success", message: "Page created." });
      navigate(`/dashboard/pages/${created.slug}`);
    } catch (err) {
      const normalized = normalizeApiError(err);
      setCreateError(normalized.errors[0]?.message ?? normalized.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await deletePage(deleteTarget._id);
      setPages((current) => current.filter((page) => page._id !== deleteTarget._id));
      setFeedback({ severity: "success", message: "Page deleted." });
      setDeleteTarget(null);
    } catch (err) {
      setFeedback({ severity: "error", message: normalizeApiError(err).message });
    } finally {
      setBusy(false);
    }
  };

  const visiblePages = pages.filter((page) => {
    const matchesStatus = statusFilter === "all" || page.status === statusFilter;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      page.slug.includes(query) ||
      page.title.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Pages
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Document-level content — each page keeps one stable ID for whole-document editing.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          New page
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={() => load()}>Retry</Button>}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <TextField
              size="small"
              label="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ minWidth: 240 }}
            />
            <TextField
              size="small"
              select
              label="Status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | PageStatus)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
            </TextField>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : visiblePages.length === 0 ? (
            <Alert severity="info">
              {pages.length === 0
                ? "No pages yet. Create the first one to start managing public content."
                : "No pages match your filters."}
            </Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Slug</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Version</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visiblePages.map((page) => (
                    <TableRow key={page._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {page.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                          /{page.slug}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={page.status}
                          color={page.status === "published" ? "success" : "default"}
                          variant={page.status === "published" ? "filled" : "outlined"}
                        />
                      </TableCell>
                      <TableCell align="right">{page.version}</TableCell>
                      <TableCell>
                        {new Date(page.updatedAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          aria-label={`Edit ${page.title}`}
                          onClick={() => navigate(`/dashboard/pages/${page.slug}`)}
                        >
                          <EditIcon fontSize="inherit" />
                        </IconButton>
                        <IconButton
                          size="small"
                          aria-label={`Delete ${page.title}`}
                          color="error"
                          onClick={() => setDeleteTarget(page)}
                        >
                          <DeleteOutlineIcon fontSize="inherit" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New page</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "16px !important" }}>
          {createError && <Alert severity="error">{createError}</Alert>}
          <TextField
            autoFocus
            label="Page title"
            value={createForm.title}
            onChange={(event) => {
              setCreateForm((current) => ({ ...current, title: event.target.value }));
              setCreateError(null);
            }}
          />
          <TextField
            label="Slug"
            value={createForm.slug}
            onChange={(event) => {
              setCreateForm((current) => ({
                ...current,
                slug: event.target.value.toLowerCase().replace(/\s+/g, "-"),
              }));
              setCreateError(null);
            }}
            helperText="Stable public identifier, e.g. about. Used in the URL /page/:slug."
          />
          <TextField
            select
            label="Status"
            value={createForm.status}
            onChange={(event) =>
              setCreateForm((current) => ({ ...current, status: event.target.value as PageStatus }))
            }
          >
            <MenuItem value="draft">Draft — hidden from the public site</MenuItem>
            <MenuItem value="published">Published — visible immediately</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="contained" onClick={submitCreate} disabled={busy}>
            {busy ? "Creating…" : "Create & open"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete page?"
        message={`"${deleteTarget?.title ?? ""}" will be removed permanently. Public visitors will fall back to the built-in static content.`}
        busy={busy}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <FeedbackSnackbar feedback={feedback} onClose={() => setFeedback(null)} />
    </Box>
  );
};

export default PagesPage;
