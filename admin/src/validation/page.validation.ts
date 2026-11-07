import { z } from "zod";
import { SECTION_TYPES, type ReplacePagePayload } from "../types/page";

/**
 * Client-side validation for the page editor.
 *
 * Mirrors `backend/src/schemas/page.schema.ts` so the form rejects bad input
 * before a round-trip, while the backend remains the authoritative check.
 * Unknown keys are stripped by Zod, which also stops protected fields from
 * being smuggled into a save payload.
 */

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const hrefSchema = z
  .string()
  .min(1, "A link is required.")
  .max(500, "Link must be 500 characters or fewer.")
  .refine(
    (value) => {
      if (value.startsWith("/") && !value.startsWith("//")) return true;
      if (value.startsWith("#")) return true;
      return isHttpUrl(value);
    },
    { message: "Use a path starting with /, a #anchor, or a full http(s) URL." },
  );

const absoluteUrlSchema = z
  .string()
  .min(1, "An image URL is required.")
  .max(2048, "Image URL is too long.")
  .refine(isHttpUrl, { message: "Must be a valid http(s) URL." });

const slugSchema = z
  .string()
  .min(1, "Slug is required.")
  .max(100, "Slug must be 100 characters or fewer.")
  .regex(SLUG_PATTERN, "Lowercase letters, numbers and hyphens only.");

const imageSchema = z.object({
  url: absoluteUrlSchema,
  public_id: z.string().max(300).optional(),
  alt: z.string().max(200).optional(),
});

const buttonSchema = z.object({
  label: z.string().min(1, "Button label is required.").max(120, "Keep the label under 120 characters."),
  href: hrefSchema,
});

const statSchema = z.object({
  value: z.string().min(1, "Value is required.").max(32, "Keep the value under 32 characters."),
  label: z.string().min(1, "Label is required.").max(120, "Keep the label under 120 characters."),
});

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
    .min(1, "Section key is required.")
    .max(64)
    .regex(SLUG_PATTERN, "Lowercase letters, numbers and hyphens only."),
  type: z.enum(SECTION_TYPES),
  heading: z.string().max(300, "Heading must be 300 characters or fewer.").optional(),
  headline: z.array(z.string().min(1).max(200)).max(6).optional(),
  subtitle: z.string().max(500).optional(),
  description: z.string().max(6000, "Keep the description under 6000 characters.").optional(),
  body: z.string().max(30000, "Keep the text under 30000 characters.").optional(),
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
  title: z.string().max(200, "SEO title must be 200 characters or fewer.").optional(),
  description: z
    .string()
    .max(320, "SEO description must be 320 characters or fewer.")
    .optional(),
  keywords: z.array(z.string().min(1).max(50)).max(20).optional(),
});

const contentSchema = z.object({
  sections: z.array(sectionSchema).max(60).default([]),
});

export const createPageSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1, "Page title is required.").max(200),
  status: z.enum(["draft", "published"]),
  content: contentSchema,
  seo: seoSchema,
});

export type CreatePageFormValues = z.infer<typeof createPageSchema>;

/**
 * Flattens Zod issues into `{ "path.to.field": "message" }` so the editor can
 * render errors inline next to the offending input. The first message per path
 * wins, matching how the backend returns `errors: [{field, message}]`.
 */
export const toFieldErrors = (issues: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const issue of issues.issues) {
    const path = issue.path.join(".");
    if (!(path in errors)) errors[path] = issue.message;
  }
  return errors;
};

/** Validates a whole page document; returns `{ ok, errors, data }`. */
export const validatePageDocument = (
  value: unknown,
):
  | { ok: true; data: CreatePageFormValues }
  | { ok: false; errors: Record<string, string> } => {
  const result = createPageSchema.safeParse(value);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, errors: toFieldErrors(result.error) };
};

/** Produces the API payload from validated form data (order = array index). */
export const toPagePayload = (
  data: CreatePageFormValues,
  expectedVersion?: number,
): ReplacePagePayload => ({
  slug: data.slug,
  title: data.title,
  status: data.status,
  content: { sections: toOrderedSections(data.content.sections) },
  seo: data.seo,
  expectedVersion,
});

const toOrderedSections = <T extends { order: number }>(sections: T[]): T[] =>
  sections.map((section, index) => ({ ...section, order: index }));
