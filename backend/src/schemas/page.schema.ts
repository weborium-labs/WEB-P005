import { z } from "zod";
import { SECTION_TYPES } from "../models/page.model.js";

/**
 * Request contracts for the page-level CMS.
 *
 * Every mutation schema is fed through `validateBody`, which parses the payload
 * and re-assigns `req.body` to the *parsed* result. Zod strips unknown keys by
 * default, which is what prevents mass assignment (`_id`, `version`,
 * `user_id`, `createdAt`, … can never be injected through the body).
 */

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Page URLs are slash-separated slug segments: `about`, `publications`, but
 * also nested addresses such as `research/overview`. 1–5 segments keeps a page
 * from swallowing the whole URL space while still letting admins configure
 * real nested URLs.
 */
export const PAGE_PATH_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*){0,4}$/;

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/** Internal route (`/about`, `#section`) or absolute http(s) URL. */
export const hrefSchema = z
  .string()
  .min(1)
  .max(500)
  .refine(
    (value) => {
      if (value.startsWith("/") && !value.startsWith("//")) return true;
      if (value.startsWith("#")) return true;
      return isHttpUrl(value);
    },
    { message: "Must be an internal path (starting with /), a #anchor, or a valid http(s) URL." },
  );

/** Absolute http(s) URL — used for images that are not media-library uploads. */
export const absoluteUrlSchema = z
  .string()
  .min(1)
  .max(2048)
  .refine(isHttpUrl, { message: "Must be a valid http(s) URL." });

const slugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(
    PAGE_PATH_PATTERN,
    "Slug may only contain lowercase letters, numbers, hyphens and single slashes between segments (e.g. `about` or `research/overview`).",
  );

const imageSchema = z.object({
  url: absoluteUrlSchema,
  public_id: z.string().max(300).optional(),
  alt: z.string().max(200).optional(),
});

const buttonSchema = z.object({
  label: z.string().min(1, "Button label is required.").max(120),
  href: hrefSchema,
});

const statSchema = z.object({
  value: z.string().min(1, "Stat value is required.").max(32),
  label: z.string().min(1, "Stat label is required.").max(120),
});

/**
 * Two-level item tree: a leaf row may carry `children` (footer columns hold
 * links). Deliberately non-recursive so the schema stays statically typed.
 */
const leafItemSchema = z.object({
  label: z.string().max(300).optional(),
  title: z.string().max(600).optional(),
  description: z.string().max(4000).optional(),
  subtitle: z.string().max(600).optional(),
  href: hrefSchema.optional(),
  external: z.boolean().optional(),
  icon: z.string().max(60).optional(),
  image: imageSchema.optional(),
});

const itemSchema = leafItemSchema.extend({
  children: z.array(leafItemSchema).max(60).optional(),
});

const sectionSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(64)
    .regex(SLUG_PATTERN, "Section key may only contain lowercase letters, numbers and hyphens."),
  type: z.enum(SECTION_TYPES),
  heading: z.string().max(300).optional(),
  headline: z.array(z.string().min(1).max(200)).max(6).optional(),
  subtitle: z.string().max(500).optional(),
  description: z.string().max(6000).optional(),
  body: z.string().max(30000).optional(),
  image: imageSchema.optional(),
  primaryButton: buttonSchema.optional(),
  secondaryButton: buttonSchema.optional(),
  cta: buttonSchema.optional(),
  stats: z.array(statSchema).max(16).optional(),
  items: z.array(itemSchema).max(300).optional(),
  visible: z.boolean().default(true),
  order: z.number().int().min(0).max(9999).default(0),
});

const seoSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(320).optional(),
  keywords: z.array(z.string().min(1).max(50)).max(20).optional(),
});

const contentSchema = z.object({
  sections: z.array(sectionSchema).max(60).default([]),
});

const pageStatusSchema = z.enum(["draft", "published"]);

/** POST /api/v1/pages — create a new page document. */
export const createPageSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1, "Page title is required.").max(200),
  status: pageStatusSchema.default("draft"),
  content: contentSchema.default({ sections: [] }),
  seo: seoSchema.default({}),
});

/**
 * PUT /api/v1/pages/:id — whole-document replacement.
 *
 * `slug` is accepted (admins may rename a page) but `_id`, `user_id`,
 * `createdAt`, `updatedAt` and `version` are intentionally absent: identity and
 * system metadata are never client-writable. `expectedVersion` enables
 * optimistic concurrency and is consumed by the controller rather than stored.
 */
export const replacePageSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1, "Page title is required.").max(200),
  status: pageStatusSchema,
  content: contentSchema,
  seo: seoSchema,
  expectedVersion: z.number().int().min(1).optional(),
});

/** PATCH /api/v1/pages/:id — intentional partial update. */
export const updatePageSchema = replacePageSchema.partial().refine(
  (value) => Object.keys(value).some((key) => key !== "expectedVersion"),
  { message: "Provide at least one field to update." },
);

/** GET /api/v1/pages — admin listing filter. */
export const listPagesQuerySchema = z.object({
  status: pageStatusSchema.optional(),
});

/**
 * GET /api/v1/pages/resolve?path=/about — public route resolution.
 *
 * The value is validated for shape only; the controller normalises it
 * (decode, lowercase, trim slashes) before looking the document up.
 */
export const resolvePageQuerySchema = z.object({
  path: z.string().min(1, "path is required.").max(300),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type ReplacePageInput = z.infer<typeof replacePageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type SectionInput = z.infer<typeof sectionSchema>;
