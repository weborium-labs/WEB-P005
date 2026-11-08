import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/**
 * 404 page.
 *
 * Reached when the CMS resolver answers "no published page for this path"
 * (and directly, for any URL that matches no route). Uses only static markup —
 * a missing page must never depend on the API to render.
 */
const NotFoundPage = () => {
  useEffect(() => {
    document.title = "Page not found";
  }, []);

  return (
    <>
      <Navbar />
      <main className="w-full flex-1 px-4 sm:px-6 lg:px-12 pt-32 sm:pt-40 pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
            404
          </p>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-heading)]">
            This page could not be found
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-text-subtle)]">
            The address may be mistyped, or the page has not been published yet.
            Head back to the homepage to keep exploring.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-6 h-12 text-[16px] font-medium text-[var(--color-text-on-primary)] shadow-[0_6px_16px_var(--color-shadow-primary)] transition-all duration-300 hover:brightness-110"
            >
              Back to home
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-6 h-12 text-[16px] font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-strong)]"
            >
              Contact
            </Link>
          </div>
        </div>
      </main>
      <Footer pageSlug="footer" />
    </>
  );
};

export default NotFoundPage;
