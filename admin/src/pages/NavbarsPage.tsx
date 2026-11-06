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
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AddIcon from "@mui/icons-material/Add";
import {
  createNavbars,
  createSubNavItems,
  deleteNavbar,
  deleteSubNavItem,
  getNavbars,
  updateNavbar,
  updateSubNavItem,
  type NavbarItem,
  type SubNavItem,
} from "../api/navbar.api";
import { isRequestCanceled, normalizeApiError } from "../api/apiClient";
import { useAuth } from "../store/auth.store";

type Feedback = { severity: "success" | "error"; message: string } | null;

interface NavbarFormState {
  open: boolean;
  mode: "create" | "edit";
  navbarId: string | null;
  item_name: string;
  order: string;
}

const EMPTY_NAVBAR_FORM: NavbarFormState = {
  open: false,
  mode: "create",
  navbarId: null,
  item_name: "",
  order: "0",
};

interface SubFormState {
  open: boolean;
  mode: "create" | "edit";
  navbarId: string | null;
  subnavId: string | null;
  item_name: string;
  page_content: string;
  item_type: "navItem" | "gallery";
  order: string;
}

const EMPTY_SUB_FORM: SubFormState = {
  open: false,
  mode: "create",
  navbarId: null,
  subnavId: null,
  item_name: "",
  page_content: "",
  item_type: "navItem",
  order: "0",
};

interface DeleteTarget {
  type: "navbar" | "subnav";
  id: string;
  label: string;
}

const NavbarsPage = () => {
  const user = useAuth((s) => s.user);

  const [navbars, setNavbars] = useState<NavbarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const [navbarForm, setNavbarForm] = useState<NavbarFormState>(EMPTY_NAVBAR_FORM);
  const [navbarFormError, setNavbarFormError] = useState<string | null>(null);
  const [subForm, setSubForm] = useState<SubFormState>(EMPTY_SUB_FORM);
  const [subFormError, setSubFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // Tracks the latest manual retry so it can be aborted on a newer retry or
  // when the page unmounts (the initial load is handled by the effect below).
  const retryControllerRef = useRef<AbortController | null>(null);

  const loadNavbars = useCallback(async (signal: AbortSignal) => {
    try {
      // State updates happen only after the request settles so effects never
      // trigger synchronous cascading renders.
      const items = await getNavbars(signal);
      setNavbars(items);
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
        void loadNavbars(controller.signal);
      }
    });
    return () => {
      controller.abort();
      retryControllerRef.current?.abort();
    };
  }, [loadNavbars]);

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

  const openCreateNavbar = () => {
    setNavbarFormError(null);
    setNavbarForm({ ...EMPTY_NAVBAR_FORM, open: true, mode: "create" });
  };

  const openEditNavbar = (navbar: NavbarItem) => {
    setNavbarFormError(null);
    setNavbarForm({
      open: true,
      mode: "edit",
      navbarId: navbar._id,
      item_name: navbar.item_name,
      order: String(navbar.order ?? 0),
    });
  };

  const submitNavbarForm = async () => {
    const itemName = navbarForm.item_name.trim();
    if (!itemName) {
      setNavbarFormError("Menu item name is required.");
      return;
    }
    if (!user && navbarForm.mode === "create") {
      setNavbarFormError("Your session could not be resolved. Please sign in again.");
      return;
    }

    const order = Number(navbarForm.order);
    if (!Number.isFinite(order) || order < 0) {
      setNavbarFormError("Order must be a non-negative number.");
      return;
    }

    const ok = await runMutation(async () => {
      if (navbarForm.mode === "create") {
        await createNavbars({
          items: [{ item_name: itemName, order }],
          user_id: user!._id,
        });
      } else {
        await updateNavbar(navbarForm.navbarId!, { item_name: itemName, order });
      }
      await loadNavbarsSilently();
      return navbarForm.mode === "create" ? "Menu item created." : "Menu item updated.";
    });

    if (ok) {
      setNavbarForm(EMPTY_NAVBAR_FORM);
      setNavbarFormError(null);
    } else {
      // Feedback snackbar already shows the failure; keep the dialog open.
    }
  };

  const loadNavbarsSilently = async () => {
    try {
      const items = await getNavbars();
      setNavbars(items);
      setError(null);
    } catch (err) {
      if (!isRequestCanceled(err)) {
        setError(normalizeApiError(err).message);
      }
    }
  };

  const openCreateSub = (navbarId: string) => {
    setSubFormError(null);
    setSubForm({ ...EMPTY_SUB_FORM, open: true, mode: "create", navbarId });
  };

  const openEditSub = (navbarId: string, sub: SubNavItem) => {
    setSubFormError(null);
    setSubForm({
      open: true,
      mode: "edit",
      navbarId,
      subnavId: sub._id,
      item_name: sub.item_name,
      page_content: sub.page_content,
      item_type: sub.item_type,
      order: String(sub.order ?? 0),
    });
  };

  const submitSubForm = async () => {
    const itemName = subForm.item_name.trim();
    const pageContent = subForm.page_content.trim();

    if (!itemName) {
      setSubFormError("Sub-item name is required.");
      return;
    }
    if (!pageContent) {
      setSubFormError("Page content is required.");
      return;
    }

    const order = Number(subForm.order);
    if (!Number.isFinite(order) || order < 0) {
      setSubFormError("Order must be a non-negative number.");
      return;
    }

    const ok = await runMutation(async () => {
      if (subForm.mode === "create") {
        await createSubNavItems(subForm.navbarId!, {
          sub_items: [
            {
              item_name: itemName,
              page_content: pageContent,
              item_type: subForm.item_type,
              order,
            },
          ],
        });
      } else {
        await updateSubNavItem(subForm.subnavId!, {
          item_name: itemName,
          page_content: pageContent,
          item_type: subForm.item_type,
          order,
        });
      }
      await loadNavbarsSilently();
      return subForm.mode === "create" ? "Sub-item created." : "Sub-item updated.";
    });

    if (ok) {
      setSubForm(EMPTY_SUB_FORM);
      setSubFormError(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const target = deleteTarget;
    setDeleteTarget(null);

    await runMutation(async () => {
      if (target.type === "navbar") {
        await deleteNavbar(target.id);
      } else {
        await deleteSubNavItem(target.id);
      }
      await loadNavbarsSilently();
      return target.type === "navbar"
        ? "Menu item and its sub-items deleted."
        : "Sub-item deleted.";
    });
  };

  return (
    <Stack spacing={3} sx={{ py: 1 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Navigation
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage the site&apos;s top-level menu items and nested sub-navigation.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateNavbar} disabled={busy}>
          Add menu item
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
                void loadNavbars(controller.signal);
              }}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading && navbars.length === 0 && !error && (
        <Box sx={{ display: "grid", placeItems: "center", py: 6 }} role="status">
          <CircularProgress aria-label="Loading navigation…" />
        </Box>
      )}

      {!loading && !error && navbars.length === 0 && (
        <Alert severity="info">
          No menu items yet. Create the first one to get started.
        </Alert>
      )}

      {navbars.map((navbar) => (
        <Card key={navbar._id} elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ p: 2, alignItems: { sm: "center" }, justifyContent: "space-between" }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {navbar.item_name}
              </Typography>
              <Chip size="small" label={`order ${navbar.order ?? 0}`} />
            </Stack>
            <Stack direction="row" spacing={0.5}>
              <Button size="small" startIcon={<AddIcon />} onClick={() => openCreateSub(navbar._id)} disabled={busy}>
                Add sub-item
              </Button>
              <IconButton size="small" aria-label={`Edit ${navbar.item_name}`} onClick={() => openEditNavbar(navbar)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                aria-label={`Delete ${navbar.item_name}`}
                onClick={() => setDeleteTarget({ type: "navbar", id: navbar._id, label: navbar.item_name })}
                disabled={busy}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>

          <Divider />

          {navbar.sub_items.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5 }}>
              No sub-items.
            </Typography>
          ) : (
            <List dense sx={{ py: 0 }}>
              {navbar.sub_items.map((sub, index) => (
                <ListItem
                  key={sub._id}
                  divider={index < navbar.sub_items.length - 1}
                  secondaryAction={
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" aria-label={`Edit ${sub.item_name}`} onClick={() => openEditSub(navbar._id, sub)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label={`Delete ${sub.item_name}`}
                        onClick={() => setDeleteTarget({ type: "subnav", id: sub._id, label: sub.item_name })}
                        disabled={busy}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={sub.item_name}
                    secondary={`order ${sub.order ?? 0}`}
                  />
                  <Chip size="small" label={sub.item_type} sx={{ mr: 6 }} />
                </ListItem>
              ))}
            </List>
          )}
        </Card>
      ))}

      {/* Navbar create/edit dialog */}
      <Dialog
        open={navbarForm.open}
        onClose={() => setNavbarForm(EMPTY_NAVBAR_FORM)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {navbarForm.mode === "create" ? "Add menu item" : "Edit menu item"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {navbarFormError && <Alert severity="error">{navbarFormError}</Alert>}
            <TextField
              label="Item name"
              value={navbarForm.item_name}
              onChange={(e) => setNavbarForm((f) => ({ ...f, item_name: e.target.value }))}
              fullWidth
              required
              autoFocus
              disabled={busy}
            />
            <TextField
              label="Order"
              type="number"
              slotProps={{ htmlInput: { min: 0 } }}
              value={navbarForm.order}
              onChange={(e) => setNavbarForm((f) => ({ ...f, order: e.target.value }))}
              fullWidth
              helperText="Lower numbers appear first."
              disabled={busy}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNavbarForm(EMPTY_NAVBAR_FORM)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void submitNavbarForm()} variant="contained" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sub-item create/edit dialog */}
      <Dialog
        open={subForm.open}
        onClose={() => setSubForm(EMPTY_SUB_FORM)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {subForm.mode === "create" ? "Add sub-item" : "Edit sub-item"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {subFormError && <Alert severity="error">{subFormError}</Alert>}
            <TextField
              label="Item name"
              value={subForm.item_name}
              onChange={(e) => setSubForm((f) => ({ ...f, item_name: e.target.value }))}
              fullWidth
              required
              autoFocus
              disabled={busy}
            />
            <TextField
              label="Page content"
              value={subForm.page_content}
              onChange={(e) => setSubForm((f) => ({ ...f, page_content: e.target.value }))}
              fullWidth
              required
              multiline
              minRows={4}
              disabled={busy}
            />
            <TextField
              label="Item type"
              select
              value={subForm.item_type}
              onChange={(e) =>
                setSubForm((f) => ({
                  ...f,
                  item_type: e.target.value as "navItem" | "gallery",
                }))
              }
              fullWidth
              disabled={busy}
            >
              <MenuItem value="navItem">navItem</MenuItem>
              <MenuItem value="gallery">gallery</MenuItem>
            </TextField>
            <TextField
              label="Order"
              type="number"
              slotProps={{ htmlInput: { min: 0 } }}
              value={subForm.order}
              onChange={(e) => setSubForm((f) => ({ ...f, order: e.target.value }))}
              fullWidth
              helperText="Lower numbers appear first."
              disabled={busy}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubForm(EMPTY_SUB_FORM)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void submitSubForm()} variant="contained" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm deletion</DialogTitle>
        <DialogContent>
          <Typography>
            {deleteTarget?.type === "navbar"
              ? `Delete "${deleteTarget.label}" and all of its sub-items? This cannot be undone.`
              : `Delete "${deleteTarget?.label}"? This cannot be undone.`}
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

export default NavbarsPage;
