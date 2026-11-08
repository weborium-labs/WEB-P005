import { z } from "zod";
import { THEME_TOKENS } from "../models/theme.model.js";

/**
 * Request contracts for website themes.
 *
 * Fed through `validateBody`, which re-assigns `req.body` to the parsed value:
 * unknown keys are stripped, so `_id`, `version`, `isActive`-smuggling on
 * nested objects and `user_id` can never be injected through the body.
 */

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * A colour value must be a CSS colour the browser can render — nothing else.
 *
 * The charset rejects `; { } : < > " ' ( ) backtick` sequences used for CSS
 * injection, and the explicit denylist blocks `var()`/`url()`/`expression()`
 * so a stored token can never reference an external resource or an arbitrary
 * custom property.
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

/** Every token is required on create/replace; PATCH accepts a subset. */
const tokensSchema = z.object(
  Object.fromEntries(
    THEME_TOKENS.map((token) => [token, colorSchema]),
  ) as Record<(typeof THEME_TOKENS)[number], z.ZodString>,
);

const themeIdentitySchema = z.object({
  name: z.string().trim().min(1, "Theme name is required.").max(80),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(SLUG_PATTERN, "Slug may only contain lowercase letters, numbers and hyphens."),
  description: z.string().trim().max(300).optional(),
});

/** POST /api/v1/themes — create a theme. */
export const createThemeSchema = themeIdentitySchema.extend({
  tokens: tokensSchema,
  isActive: z.boolean().default(false),
});

/**
 * PUT /api/v1/themes/:id — whole-document replacement.
 *
 * `expectedVersion` is consumed as a compare-and-set guard and never stored.
 */
export const replaceThemeSchema = themeIdentitySchema.extend({
  tokens: tokensSchema,
  isActive: z.boolean(),
  expectedVersion: z.number().int().min(1).optional(),
});

/** PATCH /api/v1/themes/:id — intentional partial update. */
export const updateThemeSchema = replaceThemeSchema
  .partial()
  .refine((value) => Object.keys(value).some((key) => key !== "expectedVersion"), {
    message: "Provide at least one field to update.",
  });

export type CreateThemeInput = z.infer<typeof createThemeSchema>;
export type ReplaceThemeInput = z.infer<typeof replaceThemeSchema>;
export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;
export type ThemeTokensInput = z.infer<typeof tokensSchema>;
