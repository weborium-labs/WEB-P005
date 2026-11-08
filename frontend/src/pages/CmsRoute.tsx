import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { SectionRenderer } from "../components/cms/SectionRegistry";
import { fetchPageByPath } from "../api/pages.api";
import { primePageCache, usePageSeo } from "../hooks/usePageContent";
import { ResourceCache } from "../lib/resourceCache";
import NotFoundPage from "./NotFoundPage";
import type { PageDocument } from "../types/page";

/**
 * CMS route resolver — the backend-powered catch-all route.
 *
 * Any URL that is not claimed by an explicit route (see `App.tsx`) is resolved
 * against the published pages through `GET /api/v1/pages/resolve?path=…`:
 *
 *  - published page   -> the document's sections render through the controlled
 *                        registry (`components/cms/SectionRegistry`), so an
 *                        admin can publish a page at a brand-new URL without a
 *                        frontend rebuild;
 *  - unknown / draft  -> the real 404 page (drafts are never enumerable);
 *  - API down / invalid payload -> an error panel with retry — never a blank
 *                        screen and never a fake page.
 *
 * Results are cached with the shared stale-while-revalidate cache: navigating
 * back to a page renders instantly from cache and revalidates in the
 * background.
 */

const routeCache = new ResourceCache<PageDocument>(fetchPageByPath);

type RouteState = "loading" | "ready" | "error" | "not-found";

interface Resolution {
  path: string;
  page: PageDocument | null;
  state: RouteState;
}

/** The cached page for `path` renders immediately; otherwise we are loading. */
const snapshotFor = (path: string): Resolution => {
  const cached = routeCache.peek(path);
  return { path, page: cached, state: cached ? "ready" : "loading" };
};

const useResolvedPage = (
  path: string,
): Resolution & { revalidate: () => void } => {
  const [stored, setStored] = useState<Resolution>(() => snapshotFor(path));
  const [nonce, setNonce] = useState(0);

  // The stored snapshot belongs to whichever path produced it — derive the
  // view from the cache during the render right after a navigation so the
  // previous path's page never flashes on screen.
  const resolution = stored.path === path ? stored : snapshotFor(path);

  useEffect(() => {
    let active = true;

    void routeCache.retain(path).then((result) => {
      if (!active) return;

      if (result.ok) {
        // Seed the slug cache so every section component resolves from the
        // document already in hand (one request per page, not one per section).
        primePageCache(result.value);
        setStored({ path, page: result.value, state: "ready" });
        return;
      }
      if (result.reason === "not-found") {
        setStored({ path, page: null, state: "not-found" });
        return;
      }
      // Transport / validation failure: keep a cached page if there is one.
      const cached = routeCache.peek(path);
      setStored({ path, page: cached, state: cached ? "ready" : "error" });
    });

    return () => {
      active = false;
      routeCache.release(path);
    };
  }, [path, nonce]);

  const revalidate = useCallback(() => {
    routeCache.invalidate(path);
    setNonce((value) => value + 1);
  }, [path]);

  return { ...resolution, revalidate };
};

/** The resolved page: chrome, ordered sections, then exactly one footer. */
const CmsPage = ({ page }: { page: PageDocument }) => {
  usePageSeo(page.slug);

  const sections = [...page.content.sections]
    .filter((section) => section.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const contentSections = sections.filter(
    (section) => section.type !== "chrome" && section.type !== "footer",
  );

  // A page with its own footer section controls that block (including hiding
  // it); otherwise the site-wide `footer` document renders.
  const hasFooterSection = page.content.sections.some(
    (section) => section.type === "footer",
  );

  return (
    <>
      <Navbar pageSlug={page.slug} />
      <main className="w-full flex-1">
        {contentSections.length > 0 ? (
          contentSections.map((section) => (
            <div key={`${section.type}-${section.key}`}>
              <SectionRenderer page={page} section={section} />
            </div>
          ))
        ) : (
          <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-8 lg:px-12 pt-32 pb-20">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-heading)]">
              {page.title}
            </h1>
            <p className="mt-4 text-[15px] text-[var(--color-text-subtle)]">
              This page has been published, but it has no content sections yet.
            </p>
          </section>
        )}
      </main>
      <Footer pageSlug={hasFooterSection ? page.slug : "footer"} />
    </>
  );
};

/** Loading skeleton — chrome renders immediately so the page never blanks. */
const Resolving = () => (
  <>
    <Navbar />
    <main
      className="w-full flex-1 px-4 sm:px-6 lg:px-12 pt-32 sm:pt-40 pb-20"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto max-w-3xl animate-pulse space-y-6">
        <div className="h-4 w-24 rounded-full bg-[var(--color-surface-muted)]" />
        <div className="h-9 w-2/3 rounded-lg bg-[var(--color-surface-muted)]" />
        <div className="h-4 w-full rounded bg-[var(--color-surface-muted)]" />
        <div className="h-4 w-5/6 rounded bg-[var(--color-surface-muted)]" />
        <span className="sr-only">Loading page…</span>
      </div>
    </main>
    <Footer pageSlug="footer" />
  </>
);

const RouteError = ({ onRetry }: { onRetry: () => void }) => (
  <>
    <Navbar />
    <main className="w-full flex-1 px-4 sm:px-6 lg:px-12 pt-32 sm:pt-40 pb-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-heading)]">
          We could not load this page
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-text-subtle)]">
          The content service did not respond. Check your connection and try
          again — nothing was lost.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-6 h-12 text-[16px] font-medium text-[var(--color-text-on-primary)] shadow-[0_6px_16px_var(--color-shadow-primary)] transition-all duration-300 hover:brightness-110"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-6 h-12 text-[16px] font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-strong)]"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
    <Footer pageSlug="footer" />
  </>
);

const CmsRoute = () => {
  const location = useLocation();
  const path = location.pathname;
  const { page, state, revalidate } = useResolvedPage(path);

  if (state === "ready" && page) return <CmsPage page={page} />;
  if (state === "not-found") return <NotFoundPage />;
  if (state === "error") return <RouteError onRetry={revalidate} />;
  return <Resolving />;
};

export default CmsRoute;
