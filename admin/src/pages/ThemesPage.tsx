import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  CheckCircleOutlined as ActivateIcon,
  DeleteOutlined as DeleteIcon,
  Edit as EditIcon,
  RestartAlt as ResetIcon,
} from "@mui/icons-material";
import {
  MuiColorInput,
  MuiColorInputButton,
  type MuiColorButtonProps,
} from "mui-color-input";
import {
  createTheme,
  deleteTheme,
  getThemes,
  patchTheme,
} from "../api/theme.api";
import { isRequestCanceled, normalizeApiError } from "../api/apiClient";
import ConfirmDialog from "../components/ConfirmDialog";
import FeedbackSnackbar, { type Feedback } from "../components/FeedbackSnackbar";
import { validateThemeForm } from "../validation/theme.validation";
import type {
  CreateThemePayload,
  Theme,
  ThemeTokenGroup,
  ThemeTokens,
} from "../types/theme";

interface EditorState {
  mode: "create" | "edit";
  theme: Theme | null;
  name: string;
  slug: string;
  description: string;
  tokens: ThemeTokens;
}

/**
 * The colour picker's swatch button (`mui-color-input` renders it as the
 * input's start adornment). It ships without an accessible name, so every
 * token gets its own labelled instance — one stable element per token, so the
 * popover's anchor is never remounted while typing.
 */
type SwatchFactory = (props: MuiColorButtonProps) => ReactNode;
const swatchFactories = new Map<string, SwatchFactory>();
const swatchFor = (token: string): SwatchFactory => {
  let factory = swatchFactories.get(token);
  if (!factory) {
    factory = (props) => (
      <MuiColorInputButton {...props} aria-label={`${token} colour picker`} />
    );
    swatchFactories.set(token, factory);
  }
  return factory;
};

/** `#…` values edit as hex (the shipped default format); everything else as rgb()/rgba(). */
const pickerFormat = (value: string): "hex" | "rgb" =>
  value.trim().startsWith("#") ? "hex" : "rgb";

/**
 * Theme manager: create, edit, activate and delete website colour themes.
 *
 * Every action performs a real API request (POST/PUT/PATCH/DELETE) and the
 * table re-reads the server state afterwards, so the UI always reflects the
 * database — no optimistic-only or dead buttons.
 */
export const ThemesPage = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [tokenGroups, setTokenGroups] = useState<ThemeTokenGroup[]>([]);
  const [defaultTokens, setDefaultTokens] = useState<ThemeTokens | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [editor, setEditor] = useState<EditorState | null>(null);
  /**
   * The dialog's visibility is tracked separately from `editor`: closing only
   * flips this flag, and `editor` is cleared once MUI's exit transition has
   * finished (`TransitionProps.onExited`). That keeps the fields populated for
   * the whole close animation instead of flashing an empty form, and avoids
   * reading/writing a ref during render.
   */
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [groupIndex, setGroupIndex] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Theme | null>(null);

  const draft = editor;

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getThemes(signal);
      if (signal?.aborted) return;
      setThemes(data.items);
      setTokenGroups(data.tokenGroups);
      setDefaultTokens(data.defaultTokens);
    } catch (err) {
      if (isRequestCanceled(err)) return;
      setError(normalizeApiError(err).message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Deferred so the effect body itself performs no state updates (React
    // advises against synchronous setState inside effects); the guard keeps a
    // StrictMode remount from starting a request on an already-aborted signal.
    queueMicrotask(() => {
      if (!controller.signal.aborted) void load(controller.signal);
    });
    return () => controller.abort();
  }, [load]);

  const openCreate = () => {
    if (!defaultTokens) return;
    setEditor({
      mode: "create",
      theme: null,
      name: "",
      slug: "",
      description: "",
      tokens: { ...defaultTokens },
    });
    setEditorOpen(true);
    setEditorError(null);
    setFieldErrors({});
    setGroupIndex(0);
  };

  const openEdit = (theme: Theme) => {
    setEditor({
      mode: "edit",
      theme,
      name: theme.name,
      slug: theme.slug,
      description: theme.description,
      tokens: { ...theme.tokens },
    });
    setEditorOpen(true);
    setEditorError(null);
    setFieldErrors({});
    setGroupIndex(0);
  };

  const closeEditor = () => {
    if (busy) return;
    setEditorOpen(false);
  };

  const setToken = (token: keyof ThemeTokens, value: string) => {
    setEditor((current) =>
      current ? { ...current, tokens: { ...current.tokens, [token]: value } } : current,
    );
    setFieldErrors((current) => {
      if (!current[`tokens.${token}`]) return current;
      const next = { ...current };
      delete next[`tokens.${token}`];
      return next;
    });
  };

  const submitEditor = async () => {
    if (!editor) return;

    // Trim tokens before validation so stray whitespace never trips the
    // charset check on an otherwise valid colour.
    const candidate = {
      name: editor.name,
      slug: editor.slug,
      description: editor.description,
      tokens: Object.fromEntries(
        Object.entries(editor.tokens).map(([key, value]) => [key, value.trim()]),
      ) as ThemeTokens,
    };

    const validation = validateThemeForm(candidate);
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      setEditorError("Fix the highlighted fields before saving.");
      return;
    }

    setBusy(true);
    setEditorError(null);
    try {
      if (editor.mode === "create") {
        const payload: CreateThemePayload = {
          ...validation.data,
          description: validation.data.description ?? "",
          tokens: validation.data.tokens,
          isActive: false,
        };
        const created = await createTheme(payload);
        setThemes((current) =>
          [...current, created].sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name)),
        );
        setFeedback({ severity: "success", message: "Theme created. Activate it to apply it to the site." });
      } else if (editor.theme) {
        const updated = await patchTheme(editor.theme._id, {
          ...validation.data,
          description: validation.data.description ?? "",
          tokens: validation.data.tokens,
          expectedVersion: editor.theme.version,
        });
        setThemes((current) =>
          current
            .map((theme) => (theme._id === updated._id ? updated : theme))
            .sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name)),
        );
        setFeedback({ severity: "success", message: "Theme saved." });
      }
      setEditorOpen(false);
    } catch (err) {
      const normalized = normalizeApiError(err);
      setEditorError(normalized.errors[0]?.message ?? normalized.message);
    } finally {
      setBusy(false);
    }
  };

  const activateTheme = async (theme: Theme) => {
    setBusy(true);
    try {
      const updated = await patchTheme(theme._id, {
        isActive: true,
        expectedVersion: theme.version,
      });
      setThemes((current) =>
        current
          .map((item) => (item._id === updated._id ? updated : { ...item, isActive: false }))
          .sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name)),
      );
      setFeedback({
        severity: "success",
        message: `"${updated.name}" is now the active theme — the public site picks it up on the next load.`,
      });
    } catch (err) {
      setFeedback({ severity: "error", message: normalizeApiError(err).message });
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await deleteTheme(deleteTarget._id);
      setThemes((current) => current.filter((theme) => theme._id !== deleteTarget._id));
      setFeedback({ severity: "success", message: "Theme deleted." });
      setDeleteTarget(null);
    } catch (err) {
      setFeedback({ severity: "error", message: normalizeApiError(err).message });
    } finally {
      setBusy(false);
    }
  };

  const activeGroup = tokenGroups[groupIndex];

  const swatchRow = (theme: Theme) => (
    <Box sx={{ display: "flex", gap: 0.5, mt: 1.5, flexWrap: "wrap" }}>
      {Object.values(theme.tokens).slice(0, 12).map((value, index) => (
        <Box
          key={`${value}-${index}`}
          aria-hidden
          sx={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            bgcolor: value,
            border: 1,
            borderColor: "divider",
          }}
        />
      ))}
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Themes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Colour tokens stored in the database and served to the public site through the API.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          disabled={!defaultTokens || loading}
        >
          New theme
        </Button>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" onClick={() => load()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 8 }} role="status">
          <CircularProgress size={28} aria-label="Loading themes…" />
        </Box>
      ) : themes.length === 0 ? (
        <Alert severity="info">
          No themes yet. Create one to start configuring the site palette.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {themes.map((theme) => (
            <Grid key={theme._id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2, height: "100%" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {theme.name}
                    </Typography>
                    {theme.isActive && (
                      <Chip size="small" color="success" label="Active" variant="filled" />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                    /{theme.slug}
                  </Typography>
                  {theme.description && (
                    <Typography variant="body2" sx={{ mt: 1, minHeight: 36 }}>
                      {theme.description}
                    </Typography>
                  )}
                  {swatchRow(theme)}
                  <Typography variant="caption" color="text.secondary">
                    Updated {new Date(theme.updatedAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
                  <Box>
                    <Tooltip title="Edit colours">
                      <span>
                        <IconButton
                          size="small"
                          aria-label={`Edit ${theme.name}`}
                          onClick={() => openEdit(theme)}
                          disabled={busy}
                        >
                          <EditIcon fontSize="inherit" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={theme.isActive ? "Already active" : "Make active"}>
                      <span>
                        <IconButton
                          size="small"
                          aria-label={`Activate ${theme.name}`}
                          color="success"
                          onClick={() => void activateTheme(theme)}
                          disabled={busy || theme.isActive}
                        >
                          <ActivateIcon fontSize="inherit" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={theme.isActive ? "Activate another theme first" : "Delete"}>
                      <span>
                        <IconButton
                          size="small"
                          aria-label={`Delete ${theme.name}`}
                          color="error"
                          onClick={() => setDeleteTarget(theme)}
                          disabled={busy || theme.isActive}
                        >
                          <DeleteIcon fontSize="inherit" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                  <Button
                    size="small"
                    onClick={() => openEdit(theme)}
                    disabled={busy}
                  >
                    Edit colours
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={editorOpen}
        onClose={closeEditor}
        maxWidth="md"
        fullWidth
        slotProps={{
          transition: {
            onExited: () => setEditor(null),
          },
        }}
      >
        <DialogTitle>
          {draft?.mode === "create"
            ? "New theme"
            : `Edit “${draft?.theme?.name ?? draft?.name ?? ""}”`}
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          {editorError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editorError}
            </Alert>
          )}
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <TextField
              label="Theme name"
              value={draft?.name ?? ""}
              onChange={(event) => {
                setEditor((current) => (current ? { ...current, name: event.target.value } : current));
                setFieldErrors((current) => ({ ...current, name: "" }));
              }}
              error={Boolean(fieldErrors.name)}
              helperText={fieldErrors.name}
              fullWidth
            />
            <TextField
              label="Slug"
              value={draft?.slug ?? ""}
              onChange={(event) => {
                setEditor((current) =>
                  current
                    ? { ...current, slug: event.target.value.toLowerCase().replace(/\s+/g, "-") }
                    : current,
                );
                setFieldErrors((current) => ({ ...current, slug: "" }));
              }}
              error={Boolean(fieldErrors.slug)}
              helperText={fieldErrors.slug || "Unique identifier, e.g. ocean-breeze."}
              fullWidth
            />
            <TextField
              label="Description"
              value={draft?.description ?? ""}
              onChange={(event) =>
                setEditor((current) => (current ? { ...current, description: event.target.value } : current))
              }
              error={Boolean(fieldErrors.description)}
              helperText={fieldErrors.description}
              fullWidth
              sx={{ gridColumn: { sm: "1 / -1" } }}
            />
          </Box>

          <Box sx={{ mt: 3, borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={groupIndex}
              onChange={(_event, value: number) => setGroupIndex(value)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              {tokenGroups.map((group) => (
                <Tab key={group.label} label={group.label} />
              ))}
            </Tabs>
          </Box>

          {activeGroup && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {activeGroup.hint}
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
                }}
              >
                {activeGroup.tokens.map((token) => {
                  const value = draft?.tokens[token] ?? "";
                  const errorText = fieldErrors[`tokens.${token}`];
                  const format = pickerFormat(value);
                  return (
                    <Box key={token} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <Tooltip title={`Reset to default (${defaultTokens?.[token] ?? "—"})`}>
                        <span>
                          <IconButton
                            size="small"
                            aria-label={`Reset ${token} to default`}
                            onClick={() => {
                              if (defaultTokens) setToken(token, defaultTokens[token]);
                            }}
                            disabled={!defaultTokens || busy}
                            sx={{ mt: 0.5 }}
                          >
                            <ResetIcon fontSize="inherit" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <MuiColorInput
                        size="small"
                        fullWidth
                        label={token}
                        value={value}
                        onChange={(next) => setToken(token, next)}
                        format={format}
                        // Hex tokens are opaque by design (alpha lives in the
                        // dedicated focus/shadow/glow tokens), so hide the
                        // slider instead of offering a control with no effect.
                        isAlphaHidden={format === "hex"}
                        disabled={busy}
                        error={Boolean(errorText)}
                        helperText={errorText}
                        Adornment={swatchFor(token)}
                        slotProps={{
                          htmlInput: { "aria-label": `${token} colour value` },
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditor} disabled={busy}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void submitEditor()} disabled={busy}>
            {busy ? "Saving…" : draft?.mode === "create" ? "Create theme" : "Save changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete theme?"
        message={`"${deleteTarget?.name ?? ""}" will be removed permanently. This cannot be undone.`}
        busy={busy}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <FeedbackSnackbar feedback={feedback} onClose={() => setFeedback(null)} />
    </Box>
  );
};

export default ThemesPage;
