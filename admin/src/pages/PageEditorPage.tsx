import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  DeleteOutlined as DeleteOutlineIcon,
} from "@mui/icons-material";
import { deletePage, getPage, replacePage } from "../api/page.api";
import { isRequestCanceled, normalizeApiError } from "../api/apiClient";
import SectionEditor, { SECTION_CONFIG } from "../components/SectionEditor";
import ConfirmDialog from "../components/ConfirmDialog";
import FeedbackSnackbar, { type Feedback } from "../components/FeedbackSnackbar";
import { SECTION_TYPES, type Page, type Section, type SectionType } from "../types/page";
import { toPagePayload, validatePageDocument } from "../validation/page.validation";

/** Deep clone so the editable draft never aliases the server snapshot. */
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const toDraft = (page: Page) => ({
  slug: page.slug,
  title: page.title,
  status: page.status,
  content: clone(page.content),
  seo: clone(page.seo),
});

type Draft = ReturnType<typeof toDraft>;

const newSectionKey = (type: SectionType, taken: Set<string>): string => {
  let suffix = 0;
  let key: string = type;
  while (taken.has(key)) {
    suffix += 1;
    key = `${type}-${suffix}`;
  }
  return key;
};

const makeSection = (type: SectionType, taken: Set<string>): Section => ({
  key: newSectionKey(type, taken),
  type,
  visible: true,
  order: 0,
});

/**
 * Whole-document page editor.
 *
 * Loads the existing document once, keeps an isolated draft, and saves with
 * PUT + `expectedVersion` so a concurrent edit from another admin is rejected
 * (409) instead of silently overwriting their work.
 */
export const PageEditorPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [page, setPage] = useState<Page | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const pendingNavRef = useRef<string | null>(null);
  const savedSnapshotRef = useRef<string>("");

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!slug) return;
      setLoading(true);
      setLoadError(null);
      try {
        const data = await getPage(slug, signal);
        if (signal?.aborted) return;
        const nextDraft = toDraft(data);
        setPage(data);
        setDraft(nextDraft);
        savedSnapshotRef.current = JSON.stringify(nextDraft);
        setErrors({});
        setConflict(false);
      } catch (err) {
        if (isRequestCanceled(err)) return;
        setLoadError(normalizeApiError(err).message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [slug],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const dirty = useMemo(
    () => Boolean(draft) && JSON.stringify(draft) !== savedSnapshotRef.current,
    [draft],
  );

  // Warn before a refresh/close while the document has unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Intercept in-app navigation (sidebar links, logo, breadcrumbs) while dirty.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) {
        return;
      }
      if (href === window.location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      pendingNavRef.current = href;
      setLeaveOpen(true);
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [dirty]);

  const updateDraft = (patch: Partial<Draft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setConflict(false);
  };

  const updateSections = (sections: Section[]) =>
    updateDraft({ content: { sections: sections.map((section, index) => ({ ...section, order: index })) } });

  const save = async () => {
    if (!page || !draft) return;

    const validation = validatePageDocument(draft);
    if (!validation.ok) {
      setErrors(validation.errors);
      setFeedback({
        severity: "error",
        message: "Fix the highlighted fields before saving.",
      });
      return;
    }

    setBusy(true);
    setErrors({});
    try {
      const saved = await replacePage(page._id, toPagePayload(validation.data, page.version));
      const nextDraft = toDraft(saved);
      setPage(saved);
      setDraft(nextDraft);
      savedSnapshotRef.current = JSON.stringify(nextDraft);
      setFeedback({ severity: "success", message: "Page saved." });
    } catch (err) {
      const normalized = normalizeApiError(err);
      if (normalized.status === 409) {
        setConflict(true);
        setFeedback({ severity: "error", message: normalized.message });
      } else if (normalized.errors.length > 0) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of normalized.errors) {
          if (issue.field && !(issue.field in fieldErrors)) fieldErrors[issue.field] = issue.message;
        }
        setErrors(fieldErrors);
        setFeedback({ severity: "error", message: normalized.message });
      } else {
        setFeedback({ severity: "error", message: normalized.message });
      }
    } finally {
      setBusy(false);
    }
  };

  const discard = () => {
    if (!page) return;
    const restored = toDraft(page);
    setDraft(restored);
    savedSnapshotRef.current = JSON.stringify(restored);
    setErrors({});
    setConflict(false);
    setDiscardOpen(false);
    setFeedback({ severity: "info", message: "Changes discarded." });
  };

  const confirmDelete = async () => {
    if (!page) return;
    setBusy(true);
    try {
      await deletePage(page._id);
      setFeedback({ severity: "success", message: "Page deleted." });
      setDeleteOpen(false);
      navigate("/dashboard/pages");
    } catch (err) {
      setFeedback({ severity: "error", message: normalizeApiError(err).message });
      setDeleteOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const goBack = () => {
    if (dirty) {
      pendingNavRef.current = "/dashboard/pages";
      setLeaveOpen(true);
      return;
    }
    navigate("/dashboard/pages");
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (loadError || !page || !draft) {
    return (
      <Alert
        severity="error"
        action={<Button color="inherit" onClick={() => load()}>Retry</Button>}
      >
        {loadError ?? "Page could not be loaded."}
      </Alert>
    );
  }

  const sections = draft.content.sections;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, gap: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
          <IconButton size="small" aria-label="Back to pages" onClick={goBack}>
            <ArrowBackIcon fontSize="inherit" />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {draft.title || "Untitled page"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace" }}>
              /{draft.slug} · v{page.version}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={draft.status}
            color={draft.status === "published" ? "success" : "default"}
            variant={draft.status === "published" ? "filled" : "outlined"}
          />
          {dirty && <Chip size="small" label="Unsaved changes" color="warning" variant="outlined" />}
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button color="inherit" disabled={!dirty || busy} onClick={() => setDiscardOpen(true)}>
            Discard
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlineIcon />}
            disabled={busy}
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
          <Button variant="contained" disabled={busy || !dirty} onClick={save}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </Box>
      </Box>

      {conflict && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => load()}>
              Reload latest
            </Button>
          }
        >
          This page was changed elsewhere. Reloading will replace your draft with the newest
          version — copy anything you still need first.
        </Alert>
      )}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "360px 1fr" } }}>
        {/* ---------------- Document settings ---------------- */}
        <Box>
          <Card variant="outlined">
            <CardContent sx={{ display: "grid", gap: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Document
              </Typography>

              <TextField
                size="small"
                label="Title"
                value={draft.title}
                error={Boolean(errors.title)}
                helperText={errors.title}
                onChange={(event) => updateDraft({ title: event.target.value })}
              />

              <TextField
                size="small"
                label="Slug"
                value={draft.slug}
                error={Boolean(errors.slug)}
                helperText={errors.slug ?? "Stable identifier. Renaming updates public URLs."}
                onChange={(event) =>
                  updateDraft({ slug: event.target.value.toLowerCase().replace(/\s+/g, "-") })
                }
              />

              <TextField
                size="small"
                select
                label="Status"
                value={draft.status}
                onChange={(event) =>
                  updateDraft({ status: event.target.value as Page["status"] })
                }
              >
                <MenuItem value="draft">Draft — hidden from the public site</MenuItem>
                <MenuItem value="published">Published — visible immediately</MenuItem>
              </TextField>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  SEO
                </Typography>
                <Box sx={{ display: "grid", gap: 1.5 }}>
                  <TextField
                    size="small"
                    label="Meta title"
                    value={draft.seo.title ?? ""}
                    error={Boolean(errors["seo.title"])}
                    helperText={errors["seo.title"]}
                    onChange={(event) =>
                      updateDraft({ seo: { ...draft.seo, title: event.target.value } })
                    }
                  />
                  <TextField
                    size="small"
                    label="Meta description"
                    multiline
                    minRows={3}
                    value={draft.seo.description ?? ""}
                    error={Boolean(errors["seo.description"])}
                    helperText={errors["seo.description"]}
                    onChange={(event) =>
                      updateDraft({ seo: { ...draft.seo, description: event.target.value } })
                    }
                  />
                  <TextField
                    size="small"
                    label="Keywords"
                    value={(draft.seo.keywords ?? []).join(", ")}
                    onChange={(event) =>
                      updateDraft({
                        seo: {
                          ...draft.seo,
                          keywords: event.target.value
                            .split(",")
                            .map((keyword) => keyword.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                    helperText="Comma separated."
                  />
                </Box>
              </Box>

              <Typography variant="caption" color="text.secondary">
                ID {page._id} · updated{" "}
                {new Date(page.updatedAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* ---------------- Sections ---------------- */}
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Sections ({sections.length})
            </Typography>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setAddMenuOpen(true)}>
              Add section
            </Button>
          </Box>

          {Object.keys(errors).some((key) => key.startsWith("content.")) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Some section fields are invalid — see the highlighted inputs below.
            </Alert>
          )}

          {sections.length === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              This page has no sections yet. Add one to start shaping its content.
            </Alert>
          )}

          {sections.map((section, index) => (
            <SectionEditor
              key={section.key}
              section={section}
              index={index}
              count={sections.length}
              errors={errors}
              onChange={(next) =>
                updateSections(sections.map((entry, i) => (i === index ? next : entry)))
              }
              onMove={(direction) => {
                const target = index + direction;
                if (target < 0 || target >= sections.length) return;
                const next = [...sections];
                [next[index], next[target]] = [next[target], next[index]];
                updateSections(next);
              }}
              onRemove={() => updateSections(sections.filter((_, i) => i !== index))}
            />
          ))}
        </Box>
      </Box>

      {/* ---------------- Add section ---------------- */}
      <Dialog open={addMenuOpen} onClose={() => setAddMenuOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add section</DialogTitle>
        <DialogContent dividers sx={{ display: "grid", gap: 0.5 }}>
          {SECTION_TYPES.map((type) => (
            <Button
              key={type}
              fullWidth
              sx={{ justifyContent: "flex-start", textAlign: "left" }}
              onClick={() => {
                updateSections([...sections, makeSection(type, new Set(sections.map((s) => s.key)))]);
                setAddMenuOpen(false);
              }}
            >
              {SECTION_CONFIG[type].label}
            </Button>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMenuOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={discardOpen}
        title="Discard changes?"
        message="Your unsaved edits to this page will be lost."
        confirmLabel="Discard"
        danger={false}
        busy={busy}
        onConfirm={discard}
        onClose={() => setDiscardOpen(false)}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete page?"
        message={`"${draft.title}" will be removed permanently. Public visitors will fall back to the built-in static content.`}
        busy={busy}
        onConfirm={confirmDelete}
        onClose={() => setDeleteOpen(false)}
      />

      <ConfirmDialog
        open={leaveOpen}
        title="Leave without saving?"
        message="You have unsaved changes on this page. Leaving now will discard them."
        confirmLabel="Leave"
        danger={false}
        busy={busy}
        onConfirm={() => {
          setLeaveOpen(false);
          const target = pendingNavRef.current;
          pendingNavRef.current = null;
          if (target) navigate(target);
        }}
        onClose={() => {
          setLeaveOpen(false);
          pendingNavRef.current = null;
        }}
      />

      <FeedbackSnackbar feedback={feedback} onClose={() => setFeedback(null)} />
    </Box>
  );
};

export default PageEditorPage;
