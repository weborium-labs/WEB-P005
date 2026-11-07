import type { SectionItem } from "../types/page";

/**
 * Small helpers implementing the static-fallback policy used by every dynamic
 * section on the public site.
 *
 * Policy:
 *  - a **missing or invalid** field (API never sent it / wrong type) keeps the
 *    static fallback, so a partial document never blanks the page;
 *  - an **empty scalar** (heading, description) also keeps the fallback — an
 *    empty headline would break the layout, and hiding a block is what the
 *    section-level "visible" toggle is for;
 *  - an **empty collection** (items, stats, links) IS respected: an array the
 *    admin deliberately cleared renders as an empty list, never as the old
 *    static rows.
 */

/** Non-empty trimmed string from the API, otherwise the static value. */
export const resolveText = (value: unknown, fallback: string): string =>
  typeof value === "string" && value.trim().length > 0 ? value : fallback;

/** Non-empty trimmed string or `undefined` (used for optional sub-fields). */
export const resolveOptionalText = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

/**
 * Applies `map` to an API list when the field is present, otherwise returns the
 * static list. An intentionally empty API array maps to an empty array.
 */
export const resolveList = <T>(
  value: SectionItem[] | undefined,
  map: (items: SectionItem[]) => T[],
  fallback: T[],
): T[] => {
  if (!Array.isArray(value)) return fallback;
  return map(value);
};

/** `href` that is safe to hand to an anchor: internal path, hash or http(s). */
export const resolveHref = (value: unknown, fallback: string): string => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  if (trimmed.startsWith("#")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return fallback;
};
