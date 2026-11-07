import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm action as a destructive button. */
  danger?: boolean;
  /** Disables both actions while a request is in flight. */
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Shared destructive-action confirmation. Every delete in the CMS routes
 * through this dialog so removal is never a single accidental click.
 */
export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  danger = true,
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) => (
  <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{message}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={busy}>
        {cancelLabel}
      </Button>
      <Button
        onClick={onConfirm}
        variant="contained"
        color={danger ? "error" : "primary"}
        disabled={busy}
      >
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;
