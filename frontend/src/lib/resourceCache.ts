/**
 * Small module-level cache with stale-while-revalidate semantics.
 *
 * Used by the public frontend so that:
 *  - every mounted component asking for the same resource shares ONE request
 *    (in-flight de-duplication with consumer ref-counting);
 *  - a resource that is already cached renders immediately (no layout flash)
 *    and revalidates in the background once its TTL has passed;
 *  - a failing request never evicts content that is already on screen — the
 *    static fallback (or the last good response) stays visible;
 *  - a request whose consumers have all unmounted is aborted instead of
 *    burning bandwidth on a response nobody will render.
 *
 * This deliberately is not a global state library: it is a ~150-line cache
 * shared by the read-only GET hooks of the public site.
 */

/** Successful entries live this long before a background revalidation. */
const TTL_MS = 60_000;

/**
 * Failed requests are not cached as content, but they are remembered for this
 * long so a down API is not hammered on every navigation.
 */
const FAILURE_TTL_MS = 15_000;

export type LoadResult<T> =
  | { ok: true; value: T }
  /** The resource definitively does not exist (404 / draft) — drop cache. */
  | { ok: false; reason: "not-found" }
  /** Network / server / validation failure — keep whatever is on screen. */
  | { ok: false; reason: "error" };

export type Loader<T> = (key: string, signal: AbortSignal) => Promise<LoadResult<T>>;

interface Entry<T> {
  value: T;
  fetchedAt: number;
}

interface Inflight<T> {
  promise: Promise<LoadResult<T>>;
  controller: AbortController;
  /** How many mounted hooks are waiting on this request. */
  consumers: number;
}

export class ResourceCache<T> {
  private entries = new Map<string, Entry<T>>();
  private failures = new Map<string, number>();
  private inflight = new Map<string, Inflight<T>>();
  private readonly loader: Loader<T>;
  private readonly ttlMs: number;

  constructor(loader: Loader<T>, ttlMs: number = TTL_MS) {
    this.loader = loader;
    this.ttlMs = ttlMs;
  }

  /** Last known value (fresh or stale) — used to render immediately. */
  peek(key: string): T | null {
    return this.entries.get(key)?.value ?? null;
  }

  /** True when a cached value exists and is still inside its TTL. */
  isFresh(key: string): boolean {
    const entry = this.entries.get(key);
    if (!entry) return false;
    if (Date.now() - entry.fetchedAt < this.ttlMs) return true;
    // A recent failure also suppresses immediate re-fetching.
    const failedAt = this.failures.get(key);
    return failedAt !== undefined && Date.now() - failedAt < FAILURE_TTL_MS;
  }

  /** Marks a key as missing (e.g. the document was deleted or unpublished). */
  invalidate(key?: string): void {
    if (key === undefined) {
      this.entries.clear();
      this.failures.clear();
      return;
    }
    this.entries.delete(key);
    this.failures.delete(key);
  }

  /**
   * Loads a key, de-duplicating concurrent callers onto a single request.
   *
   * - joins an in-flight request when there is one;
   * - resolves immediately from cache while the entry is fresh (no network);
   * - otherwise starts one request for every mounted consumer.
   *
   * Every caller must pair `retain` with `release` so the underlying request
   * is aborted once nobody is listening.
   */
  retain(key: string): Promise<LoadResult<T>> {
    const existing = this.inflight.get(key);
    if (existing) {
      existing.consumers += 1;
      return existing.promise;
    }

    const cached = this.entries.get(key);
    const failedAt = this.failures.get(key);
    const backingOff = failedAt !== undefined && Date.now() - failedAt < FAILURE_TTL_MS;
    const fresh =
      cached !== undefined && Date.now() - cached.fetchedAt < this.ttlMs && !backingOff;

    // Fresh cache: serve it without touching the network (stale-while-revalidate
    // happens when the entry ages past the TTL on a later mount).
    if (fresh && cached) {
      return Promise.resolve({ ok: true, value: cached.value });
    }
    // A request failed moments ago and there is nothing usable on screen:
    // short-circuit instead of hammering a down API.
    if (backingOff) {
      return Promise.resolve(
        cached
          ? ({ ok: true, value: cached.value } as LoadResult<T>)
          : ({ ok: false, reason: "error" } as LoadResult<T>),
      );
    }

    const controller = new AbortController();
    const entry: Inflight<T> = { controller, consumers: 1, promise: undefined as never };
    this.inflight.set(key, entry);

    entry.promise = this.loader(key, controller.signal)
      .then((result) => {
        if (result.ok) {
          this.entries.set(key, { value: result.value, fetchedAt: Date.now() });
          this.failures.delete(key);
        } else if (result.reason === "not-found") {
          this.entries.delete(key);
          // Negative-cached too: a deleted/draft page must not trigger a
          // request on every single navigation.
          this.failures.set(key, Date.now());
        } else {
          this.failures.set(key, Date.now());
        }
        return result;
      })
      .catch((error: unknown) => {
        // An aborted request is not a failure worth remembering.
        if (!controller.signal.aborted) this.failures.set(key, Date.now());
        if (isAbortError(error)) return { ok: false, reason: "error" } as LoadResult<T>;
        return { ok: false, reason: "error" } as LoadResult<T>;
      })
      .finally(() => {
        // Only remove the entry if it is still ours (a newer request may have
        // replaced it while this one settled).
        if (this.inflight.get(key) === entry) this.inflight.delete(key);
      });

    return entry.promise;
  }

  /** Called when a consumer unmounts or switches keys. */
  release(key: string): void {
    const entry = this.inflight.get(key);
    if (!entry) return;
    entry.consumers -= 1;
    if (entry.consumers <= 0) {
      entry.controller.abort();
      this.inflight.delete(key);
    }
  }
}

export const isAbortError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { name?: string }).name === "AbortError";

/**
 * Structural validation for a payload that is supposed to be a page document.
 * An invalid payload is rejected so the static fallback stays on screen
 * instead of the app rendering half-parsed garbage.
 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
