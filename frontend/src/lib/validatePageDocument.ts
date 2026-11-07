import type { PageDocument, Section } from "../types/page";
import { isRecord } from "./resourceCache";

/**
 * Structural validation for a payload that is supposed to be a page document.
 *
 * Lives apart from the HTTP client so it can be exercised on its own (e.g.
 * against a live API response) and so a malformed payload is always rejected
 * before it reaches the UI — the static fallback then stays on screen instead
 * of the app rendering half-parsed garbage.
 */

const isHttpUrl = (value: unknown): value is string =>
  typeof value === "string" && /^https?:\/\//.test(value);

const isButton = (value: unknown): boolean =>
  isRecord(value) && typeof value.label === "string" && typeof value.href === "string";

const isImage = (value: unknown): boolean => isRecord(value) && isHttpUrl(value.url);

const isItem = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  if (value.image !== undefined && !isImage(value.image)) return false;
  if (value.children !== undefined) {
    if (!Array.isArray(value.children) || !value.children.every(isItem)) return false;
  }
  // An item must carry at least one usable field.
  const fields = ["label", "title", "description", "subtitle", "href", "icon"];
  return fields.some((field) => typeof value[field] === "string");
};

const isSection = (value: unknown): value is Section => {
  if (!isRecord(value)) return false;
  if (typeof value.key !== "string" || value.key.length === 0) return false;
  if (typeof value.type !== "string") return false;
  if (value.visible !== undefined && typeof value.visible !== "boolean") return false;
  if (value.headline !== undefined && !Array.isArray(value.headline)) return false;
  if (value.items !== undefined && (!Array.isArray(value.items) || !value.items.every(isItem))) {
    return false;
  }
  if (value.stats !== undefined) {
    if (!Array.isArray(value.stats)) return false;
    for (const stat of value.stats) {
      if (!isRecord(stat) || typeof stat.value !== "string" || typeof stat.label !== "string") {
        return false;
      }
    }
  }
  if (value.primaryButton !== undefined && !isButton(value.primaryButton)) return false;
  if (value.secondaryButton !== undefined && !isButton(value.secondaryButton)) return false;
  if (value.cta !== undefined && !isButton(value.cta)) return false;
  if (value.image !== undefined && !isImage(value.image)) return false;
  return true;
};

/** Validates a full page document; returns `null` when it is unusable. */
export const validatePageDocument = (raw: unknown): PageDocument | null => {
  if (!isRecord(raw)) return null;
  if (typeof raw._id !== "string" || typeof raw.slug !== "string") return null;
  if (typeof raw.title !== "string") return null;

  const content = raw.content;
  if (!isRecord(content) || !Array.isArray(content.sections)) return null;
  if (!content.sections.every(isSection)) return null;

  if (
    raw.seo !== undefined &&
    (!isRecord(raw.seo) ||
      (raw.seo.title !== undefined && typeof raw.seo.title !== "string") ||
      (raw.seo.description !== undefined && typeof raw.seo.description !== "string"))
  ) {
    return null;
  }

  return raw as unknown as PageDocument;
};
