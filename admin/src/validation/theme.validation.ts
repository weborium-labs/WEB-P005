import { z } from "zod";
import { THEME_TOKENS, type CreateThemePayload, type ThemeTokens } from "../types/theme";

/**
 * Client-side validation for the theme editor.
 *
 * Mirrors `backend/src/schemas/theme.schema.ts` so the form rejects bad input
 * before a round-trip, while the backend remains the authoritative check.
 */

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Same colour contract as the backend: a CSS colour only, with `var()`/`url()`
 * style injection blocked.
 */
const COLOR_CHARSET = /^[a-zA-Z0-9#(),.\s%/-]+$/;

export const isColorValue = (raw: string): boolean => {
  const value = raw.trim();
  if (value.length === 0 || value.length > 64) return false;
  if (!COLOR_CHARSET.test(value)) return false;
  if (/^(var|url|expression|calc|env|attr|image-set|counter)\s*\(/i.test(value)) return false;

  return (
    /^#[0-9a-f]{3,8}$/i.test(value) ||
    /^rgba?\([^)]*\)$/i.test(value) ||
    /^hsla?\([^)]*\)$/i.test(value) ||
    /^[a-z]+$/i.test(value)
  );
};

const colorSchema = z
  .string()
  .trim()
  .min(1, "Colour value is required.")
  .max(64, "Colour value is too long.")
  .refine(isColorValue, {
    message: "Must be a CSS colour such as #RRGGBB, rgb(...), hsl(...) or a named colour.",
  });

const tokensSchema = z.object(
  Object.fromEntries(
    THEME_TOKENS.map((token) => [token, colorSchema]),
  ) as Record<(typeof THEME_TOKENS)[number], z.ZodString>,
);

export const createThemeFormSchema = z.object({
  name: z.string().trim().min(1, "Theme name is required.").max(80),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(80)
    .regex(SLUG_PATTERN, "Lowercase letters, numbers and hyphens only."),
  description: z.string().trim().max(300).optional(),
  tokens: tokensSchema,
});

export type CreateThemeFormValues = z.infer<typeof createThemeFormSchema>;

/** Flattens Zod issues into `{ "path.to.field": "message" }` for inline errors. */
export const toFieldErrors = (issues: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const issue of issues.issues) {
    const path = issue.path.join(".");
    if (!(path in errors)) errors[path] = issue.message;
  }
  return errors;
};

/** Validates a whole theme document; returns `{ ok, errors, data }`. */
export const validateThemeForm = (
  value: unknown,
):
  | { ok: true; data: CreateThemeFormValues }
  | { ok: false; errors: Record<string, string> } => {
  const result = createThemeFormSchema.safeParse(value);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, errors: toFieldErrors(result.error) };
};

/** Produces the API payload from validated form data. */
export const toThemePayload = (
  data: CreateThemeFormValues,
  isActive: boolean,
  expectedVersion?: number,
): CreateThemePayload & { expectedVersion?: number } => ({
  name: data.name,
  slug: data.slug,
  description: data.description ?? "",
  tokens: data.tokens as ThemeTokens,
  isActive,
  expectedVersion,
});
