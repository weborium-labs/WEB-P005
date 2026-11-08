import axios from "axios";
import apiClient from "./apiClient";
import { type LoadResult } from "../lib/resourceCache";
import { validateThemeTokens, type ThemeTokens } from "../theme/tokens";

/**
 * Active-theme reader for the public site.
 *
 * The payload is structurally validated before it reaches the DOM: a malformed
 * or hostile response is dropped and the built-in `:root` defaults stay in
 * effect, so a bad API answer can never half-theme (or break) the page.
 */
export const fetchActiveTheme = async (
  _key: string,
  signal: AbortSignal,
): Promise<LoadResult<ThemeTokens>> => {
  try {
    const response = await apiClient.get("/themes/active", { signal });
    const payload = response.data?.data ?? response.data;
    const tokens = validateThemeTokens(payload?.tokens ?? payload);
    if (!tokens) return { ok: false, reason: "error" };
    return { ok: true, value: tokens };
  } catch (error) {
    if (axios.isCancel(error) || (error as { name?: string })?.name === "AbortError") {
      return { ok: false, reason: "error" };
    }
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      // No active theme in the database — the defaults are the theme.
      return { ok: false, reason: "not-found" };
    }
    return { ok: false, reason: "error" };
  }
};
