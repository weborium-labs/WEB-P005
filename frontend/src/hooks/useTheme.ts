import { useCallback, useEffect, useState } from "react";
import { fetchActiveTheme } from "../api/theme.api";
import { ResourceCache } from "../lib/resourceCache";
import { applyThemeTokens } from "../theme/applyTheme";
import type { ThemeTokens } from "../theme/tokens";

/**
 * Loads the active theme from `GET /api/v1/themes/active` and writes it onto
 * `<html>` as CSS custom properties.
 *
 * Behaviour matches the rest of the public-site read hooks:
 *  - shared module-level cache (one request for the whole app, 60s TTL,
 *    stale-while-revalidate on later navigations);
 *  - a failing request never removes the colours already on screen — the
 *    `:root` defaults (or the last good theme) keep rendering;
 *  - `refreshKey` (the current pathname) re-checks the TTL on navigation, so
 *    an admin theme switch is picked up on the next navigation after it
 *    becomes stale — without any frontend rebuild.
 */

const CACHE_KEY = "active";
const themeCache = new ResourceCache<ThemeTokens>(fetchActiveTheme);

export type ThemeState = "loading" | "ready" | "error";

interface ThemeHandle {
  state: ThemeState;
  /** Forces a refetch, ignoring the TTL (used by error UIs / manual retry). */
  revalidate: () => void;
}

export const useTheme = (refreshKey?: string): ThemeHandle => {
  const [state, setState] = useState<ThemeState>(() =>
    themeCache.peek(CACHE_KEY) ? "ready" : "loading",
  );
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    // True while this effect run is the current one; a response that lands
    // after a newer run started is ignored.
    let active = true;

    void themeCache.retain(CACHE_KEY).then((result) => {
      if (!active) return;
      if (result.ok) {
        applyThemeTokens(result.value);
        setState("ready");
        return;
      }
      // Keep whatever is currently painted (defaults or last good theme).
      setState(themeCache.peek(CACHE_KEY) ? "ready" : "error");
    });

    return () => {
      active = false;
      themeCache.release(CACHE_KEY);
    };
  }, [refreshKey, nonce]);

  const revalidate = useCallback(() => {
    themeCache.invalidate(CACHE_KEY);
    setNonce((value) => value + 1);
  }, []);

  return { state, revalidate };
};

export default useTheme;
