import { useCallback, useEffect, useState } from "react";
import { fetchPageBySlug } from "../api/pages.api";
import { ResourceCache } from "../lib/resourceCache";
import type { PageDocument, Section, SectionStat, SectionType } from "../types/page";

/**
 * Public page-content reader with silent static→API synchronisation.
 *
 * Behaviour (see the fallback table in the CMS spec):
 *
 * | Situation                              | Result                                   |
 * |----------------------------------------|------------------------------------------|
 * | No cached data yet, request pending    | `state: "loading"` → caller renders its static fallback |
 * | API returned a valid document          | `state: "ready"`   → caller renders API content |
 * | API request failed / invalid payload   | `state: "error"`   → caller keeps static fallback |
 * | API says 404 (deleted or draft page)   | `state: "missing"` → caller keeps static fallback |
 * | Cached copy exists (fresh or stale)    | rendered immediately, revalidated in background |
 *
 * Multiple components mounted for the same slug share a single request, and a
 * response for a slug the component has navigated away from is ignored.
 */

/** Shared across the whole app so navigating back does not refetch. */
const pageCache = new ResourceCache<PageDocument>(fetchPageBySlug);

export type PageState = "loading" | "ready" | "error" | "missing";

export interface PageContent {
  page: PageDocument | null;
  state: PageState;
  /** True once a definitive answer (success or 404) has been received. */
  settled: boolean;
  /** Forces a background revalidation, ignoring the TTL. */
  revalidate: () => void;
}

/** Drops cached page documents so the next read hits the API. */
export const invalidatePageCache = (slug?: string): void => {
  pageCache.invalidate(slug);
};

/**
 * Seeds the slug cache with a document that was fetched through another
 * endpoint (`GET /pages/resolve?path=…`), so the section components mounted
 * for that page resolve instantly instead of issuing a second request.
 */
export const primePageCache = (page: PageDocument): void => {
  pageCache.prime(page.slug, page);
};

interface PageSnapshot {
  slug: string | undefined;
  page: PageDocument | null;
  state: PageState;
  settled: boolean;
}

/** View for a slug: an already cached document renders instantly, else "loading". */
const snapshotFor = (slug?: string): PageSnapshot => {
  if (!slug) return { slug, page: null, state: "loading", settled: false };
  const cached = pageCache.peek(slug);
  return { slug, page: cached, state: cached ? "ready" : "loading", settled: false };
};

export const usePageContent = (slug?: string): PageContent => {
  const [stored, setStored] = useState<PageSnapshot>(() => snapshotFor(slug));
  const [nonce, setNonce] = useState(0);

  // The stored snapshot belongs to whichever slug produced it. On the render
  // right after navigating (before the effect below runs) we derive the view
  // from the cache instead of flashing the previous slug's document.
  const snapshot = stored.slug === slug ? stored : snapshotFor(slug);

  useEffect(() => {
    // Nothing to load — the derived view already reports "loading" with no
    // content, so the caller keeps rendering its static fallback.
    if (!slug) return;

    const currentSlug = slug;
    // Only the effect run that is still current may write state; a response
    // for a slug the component has navigated away from is dropped here.
    let active = true;

    const promise = pageCache.retain(currentSlug);
    void promise.then((result) => {
      if (!active) return;

      if (result.ok) {
        setStored({ slug: currentSlug, page: result.value, state: "ready", settled: true });
        return;
      }
      if (result.reason === "not-found") {
        // The document was deleted or unpublished — the cached copy was
        // dropped too, so we fall back to static markup.
        setStored({ slug: currentSlug, page: null, state: "missing", settled: true });
        return;
      }
      // Transport/validation failure: keep whatever is on screen.
      const cached = pageCache.peek(currentSlug);
      setStored({
        slug: currentSlug,
        page: cached,
        state: cached ? "ready" : "error",
        settled: true,
      });
    });

    return () => {
      active = false;
      pageCache.release(currentSlug);
    };
  }, [slug, nonce]);

  const revalidate = useCallback(() => {
    if (slug) pageCache.invalidate(slug);
    setNonce((value) => value + 1);
  }, [slug]);

  return {
    page: snapshot.page,
    state: snapshot.state,
    settled: snapshot.settled,
    revalidate,
  };
};

/**
 * Resolves one section of a page document for a component.
 *
 * The three-way result lets a component implement the full fallback policy:
 *  - `"fallback"`: no API answer yet (pending/failed/404) → render static copy;
 *  - `"hidden"`:   the API answered and the section was removed or set to
 *                  "not visible" → render nothing (the admin's intent);
 *  - `"section"`:  render the API content.
 *
 * `key` disambiguates pages that hold several sections of one type (e.g. the
 * home page carries two `list` sections: research and patents).
 */
export type SectionResult =
  | { outcome: "fallback" }
  | { outcome: "hidden" }
  | { outcome: "section"; section: Section };

export const usePageSection = (
  slug: string | undefined,
  type: SectionType,
  key?: string,
): SectionResult => {
  const { page, state } = usePageContent(slug);

  // No usable API answer yet (pending, failed, or document deleted) — the
  // caller keeps rendering its static fallback content.
  if (state !== "ready" || !page) {
    return { outcome: "fallback" };
  }

  const sections = page.content?.sections ?? [];
  const candidates = sections
    .filter((section) => section.type === type)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const section = key ? candidates.find((entry) => entry.key === key) : candidates[0];

  if (!section || section.visible === false) {
    return { outcome: "hidden" };
  }
  return { outcome: "section", section };
};

/**
 * Reads the `text` section a list page uses as its header block.
 *
 * Returns `undefined` for a field whenever the API has not answered yet, the
 * document is gone, or the value is empty — the caller then keeps its static
 * markup (the fallback policy). Only a non-empty value from a valid section
 * overrides what is on screen.
 *
 * `stats` is the exception: it is a collection, so an intentionally cleared
 * array is passed through as `[]` (the caller hides its stat block) while a
 * missing field stays `undefined` (the caller keeps its static block).
 */
export const usePageHeader = (
  slug?: string,
  key = "header",
): {
  heading: string | undefined;
  description: string | undefined;
  stats: SectionStat[] | undefined;
} => {
  const resolved = usePageSection(slug, "text", key);

  if (resolved.outcome !== "section") {
    return { heading: undefined, description: undefined, stats: undefined };
  }

  return {
    heading: resolved.section.heading?.trim() || undefined,
    description: resolved.section.description?.trim() || undefined,
    stats: resolved.section.stats,
  };
};

/** Applies the page's SEO metadata to the document head when it arrives. */
export const usePageSeo = (slug?: string): void => {
  const { page, state } = usePageContent(slug);

  useEffect(() => {
    if (state !== "ready" || !page) return;

    const previousTitle = document.title;
    const nextTitle = page.seo?.title?.trim() || page.title;
    if (nextTitle) document.title = nextTitle;

    const description = page.seo?.description?.trim();
    if (!description) return;

    const meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.getAttribute("content") ?? null;
    if (meta) {
      meta.setAttribute("content", description);
    } else {
      const created = document.createElement("meta");
      created.setAttribute("name", "description");
      created.setAttribute("content", description);
      document.head.appendChild(created);
    }

    return () => {
      document.title = previousTitle;
      if (meta && previousDescription !== null) {
        meta.setAttribute("content", previousDescription);
      }
    };
  }, [page, state]);
};
