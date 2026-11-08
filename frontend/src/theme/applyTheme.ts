import { THEME_TOKENS, toCssVar, validateThemeTokens, type ThemeTokens } from "./tokens";

/**
 * Applies theme tokens to the document as CSS custom properties.
 *
 * `index.css` ships the exact same defaults under `:root`, so:
 *  - before any API response the site already renders in the default palette
 *    (no flash of unstyled or wrong colours);
 *  - the last applied theme is mirrored into `sessionStorage` and re-applied
 *    synchronously on the next page load, so repeat visits paint with the
 *    current theme even before `GET /themes/active` answers.
 */

const STORAGE_KEY = "p005.active-theme";

/** Reference of the last applied payload — identical objects are skipped. */
let lastApplied: ThemeTokens | null = null;

const writeTokens = (tokens: ThemeTokens): void => {
  const root = document.documentElement;
  for (const token of THEME_TOKENS) {
    root.style.setProperty(toCssVar(token), tokens[token]);
  }
};

/** Overwrites the `:root` defaults with a theme payload (idempotent). */
export const applyThemeTokens = (tokens: ThemeTokens): void => {
  if (tokens === lastApplied) return;
  lastApplied = tokens;
  writeTokens(tokens);
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // Private-mode / quota failures only cost the next paint's early theme.
  }
};

/** Drops every override so the built-in `:root` defaults apply again. */
export const clearThemeTokens = (): void => {
  lastApplied = null;
  const root = document.documentElement;
  for (const token of THEME_TOKENS) {
    root.style.removeProperty(toCssVar(token));
  }
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clean up.
  }
};

/** Re-applies the previously painted theme before the first render of a load. */
const restoreStoredTheme = (): void => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const tokens = validateThemeTokens(JSON.parse(raw));
    if (!tokens) return;
    lastApplied = tokens;
    writeTokens(tokens);
  } catch {
    // Corrupt or unavailable storage: built-in defaults are correct anyway.
  }
};

restoreStoredTheme();
