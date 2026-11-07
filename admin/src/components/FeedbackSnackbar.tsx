import { Alert, Snackbar } from "@mui/material";

export interface Feedback {
  severity: "success" | "error" | "info" | "warning";
  message: string;
}

interface FeedbackSnackbarProps {
  feedback: Feedback | null;
  onClose: () => void;
}

/** Success/error toast shared by the CMS screens. */
export const FeedbackSnackbar = ({ feedback, onClose }: FeedbackSnackbarProps) => (
  <Snackbar
    open={Boolean(feedback)}
    autoHideDuration={4000}
    onClose={onClose}
    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
  >
    <Alert onClose={onClose} severity={feedback?.severity ?? "info"} variant="filled">
      {feedback?.message}
    </Alert>
  </Snackbar>
);

export default FeedbackSnackbar;
