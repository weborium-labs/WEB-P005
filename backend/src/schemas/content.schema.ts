import { z } from "zod";
import { SUB_ITEM_TYPES } from "../models/sub_nav_item.model.js";

/** Shared enum so admin forms and API validation agree on content kinds. */
export const subItemTypeSchema = z.enum(SUB_ITEM_TYPES);

export const navbarNameSchema = z
  .string()
  .min(1, "Menu item name is required.")
  .max(120);

/** POST /api/v1/navbars */
export const createNavbarsSchema = z.object({
  items: z
    .array(
      z.object({
        item_name: navbarNameSchema,
        order: z.number().int().min(0).max(9999).optional(),
      }),
    )
    .min(1, "Provide an array of items with at least one item.")
    .max(100),
});

/** PUT /api/v1/navbars/:navbar_id — complete replacement of the editable fields. */
export const replaceNavbarSchema = z.object({
  item_name: navbarNameSchema,
  order: z.number().int().min(0).max(9999),
});

/** POST /api/v1/navbars/:navbar_id/subnavbars */
export const createSubNavbarsSchema = z.object({
  sub_items: z
    .array(
      z.object({
        item_name: navbarNameSchema,
        // 100k chars ≈ a full page of CMS content stored as JSON.
        page_content: z.string().max(100_000).default(""),
        item_type: subItemTypeSchema.default("navItem"),
        order: z.number().int().min(0).max(9999).optional(),
      }),
    )
    .min(1, "Provide at least one sub-item.")
    .max(100),
});

/** PUT /api/v1/subnavbars/:subnav_id — complete replacement. */
export const replaceSubNavbarSchema = z.object({
  item_name: navbarNameSchema,
  page_content: z.string().max(100_000),
  item_type: subItemTypeSchema,
  order: z.number().int().min(0).max(9999),
});

/** GET /api/v1/publications — optional filtering + backwards-compatible paging. */
export const listPublicationsQuerySchema = z.object({
  user_id: z.string().max(64).optional(),
  // Free-form on purpose: the controller lowercases it, matching the previous
  // behaviour, so an unknown value simply filters to nothing.
  type: z.string().max(20).optional(),
  page: z.coerce.number().int().min(1).max(100000).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const publicationFields = {
  type: z.enum(["journal", "conference"]),
  title: z.string().min(1, "Title is required.").max(600),
  year: z
    .number()
    .int("Year must be a whole number.")
    .min(1900, "Enter a valid year (1900–2100).")
    .max(2100, "Enter a valid year (1900–2100)."),
  publication_name: z.string().min(1, "Publication name is required.").max(400),
  redirect_url: z
    .string()
    .min(1, "Redirect URL is required.")
    .max(1000)
    .refine(isHttpUrl, { message: "Must be a valid http(s) URL." }),
  volume_issue: z.string().max(200).default(""),
  indexing: z.string().max(200).default(""),
  order: z.number().int().min(0).max(99999).default(0),
};

const publicationArraySchema = z
  .array(z.object(publicationFields))
  .min(1, "Please provide valid publication data.")
  .max(500);

/**
 * POST /api/v1/publications.
 *
 * The endpoint historically accepted three request shapes — the
 * `{ publications: [...] }` envelope used by the admin, a bare JSON array, and
 * a single object. All three are normalised to the envelope so no existing
 * client contract changes, while every field still goes through the whitelist.
 */
export const createPublicationsSchema = z.preprocess((raw) => {
  if (Array.isArray(raw)) return { publications: raw };
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    if (Array.isArray(record.publications)) return { publications: record.publications };
    if (record.type !== undefined || record.title !== undefined) {
      return { publications: [record] };
    }
  }
  return raw;
}, z.object({ publications: publicationArraySchema }));

/** PUT /api/v1/publications/:id — whitelist of client-writable fields. */
export const replacePublicationSchema = z.object(publicationFields);

/** GET /api/v1/glimpses — optional filtering + backwards-compatible paging. */
export const listGlimpsesQuerySchema = z.object({
  user_id: z.string().max(64).optional(),
  page: z.coerce.number().int().min(1).max(100000).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type CreateNavbarsInput = z.infer<typeof createNavbarsSchema>;
export type ReplaceNavbarInput = z.infer<typeof replaceNavbarSchema>;
export type CreateSubNavbarsInput = z.infer<typeof createSubNavbarsSchema>;
export type ReplaceSubNavbarInput = z.infer<typeof replaceSubNavbarSchema>;
export type ListPublicationsQuery = z.infer<typeof listPublicationsQuerySchema>;
export type CreatePublicationsInput = z.infer<typeof createPublicationsSchema>;
export type ReplacePublicationInput = z.infer<typeof replacePublicationSchema>;
export type ListGlimpsesQuery = z.infer<typeof listGlimpsesQuerySchema>;
