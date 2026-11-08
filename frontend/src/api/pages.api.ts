import axios from "axios";
import apiClient from "./apiClient";
import type { PageDocument } from "../types/page";
import { type LoadResult } from "../lib/resourceCache";
import { validatePageDocument } from "../lib/validatePageDocument";

/**
 * Page document reader for the public site.
 *
 * Every response is structurally validated (see `lib/validatePageDocument`)
 * before it is handed to the UI: a malformed payload is treated exactly like a
 * failed request so the built-in static fallback stays on screen instead of
 * rendering broken markup.
 */

/**
 * Fetches one page by its stable slug.
 *
 * - 200 with a valid document  -> `{ ok: true, value }`
 * - 404 (deleted / draft)      -> `{ ok: false, reason: "not-found" }`
 * - anything else (network,
 *   5xx, invalid structure)    -> `{ ok: false, reason: "error" }` — the caller
 *   keeps its current content, so the static fallback survives an outage.
 */
export const fetchPageBySlug = async (
  slug: string,
  signal: AbortSignal,
): Promise<LoadResult<PageDocument>> => {
  try {
    const response = await apiClient.get(`/pages/${encodeURIComponent(slug)}`, { signal });
    const payload = response.data?.data ?? response.data;
    const page = validatePageDocument(payload);
    if (!page) return { ok: false, reason: "error" };
    return { ok: true, value: page };
  } catch (error) {
    if (axios.isCancel(error) || (error as { name?: string })?.name === "AbortError") {
      return { ok: false, reason: "error" };
    }
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { ok: false, reason: "not-found" };
    }
    return { ok: false, reason: "error" };
  }
};

/** Convenience reader used by the SEO hook (validated like everything else). */
export const fetchPage = (slug: string, signal: AbortSignal) =>
  fetchPageBySlug(slug, signal);

/**
 * Resolves an arbitrary URL path to its CMS page document.
 *
 * This is the backend-powered route resolver behind the frontend catch-all
 * route: any path the admin publishes a page at is served here, with no
 * frontend rebuild. Identical result contract to `fetchPageBySlug` — a path
 * with no published page (or a draft seen without authorisation) is a 404 and
 * therefore `"not-found"`, never enumerable.
 */
export const fetchPageByPath = async (
  path: string,
  signal: AbortSignal,
): Promise<LoadResult<PageDocument>> => {
  try {
    const response = await apiClient.get("/pages/resolve", {
      params: { path },
      signal,
    });
    const payload = response.data?.data ?? response.data;
    const page = validatePageDocument(payload);
    if (!page) return { ok: false, reason: "error" };
    return { ok: true, value: page };
  } catch (error) {
    if (axios.isCancel(error) || (error as { name?: string })?.name === "AbortError") {
      return { ok: false, reason: "error" };
    }
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { ok: false, reason: "not-found" };
    }
    return { ok: false, reason: "error" };
  }
};
