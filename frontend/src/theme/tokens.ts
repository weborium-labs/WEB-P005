/**
 * Website theme tokens (public site copy).
 *
 * Mirrors `backend/src/models/theme.model.ts` — keep the two in sync
 * (`npm run verify:tokens` fails when they drift, or when
 * `src/index.css` defaults drift from the backend defaults).
 *
 * The CSS fallbacks live in `index.css` (`:root`), so the site is fully
 * coloured before any API response; this module only exists to validate and
 * name the tokens the API can override.
 */

export const THEME_TOKENS = [
  // Brand
  "primary",
  "primaryDeep",
  "primaryStrong",
  "primarySoft",
  "primaryLight",
  "primaryGlow",
  "secondary",
  "accent",
  "accentStrong",
  "accentSoft",
  // Surfaces
  "background",
  "backgroundAlt",
  "surface",
  "surfaceRaised",
  "surfaceHover",
  "surfaceMuted",
  "surfaceSoft",
  "surfaceSoftHover",
  "surfacePill",
  // Borders
  "border",
  "borderStrong",
  "borderSoft",
  "borderMuted",
  "borderFaint",
  // Text
  "textPrimary",
  "textHeading",
  "textBody",
  "textSubtle",
  "textSecondary",
  "textHero",
  "textMuted",
  "textFaint",
  "textNav",
  "textOnPrimary",
  "iconStrong",
  // Effects
  "focusRing",
  "shadowPrimary",
  "glowAccent",
] as const;

export type ThemeToken = (typeof THEME_TOKENS)[number];

export type ThemeTokens = Record<ThemeToken, string>;

/**
 * Same colour contract as the backend: a CSS colour only, with `var()`/`url()`
 * style injection blocked. A payload that fails this check is discarded and
 * the CSS defaults stay in effect.
 */
const COLOR_CHARSET = /^[a-zA-Z0-9#(),.\s%/-]+$/;

export const isSafeColor = (raw: unknown): raw is string => {
  if (typeof raw !== "string") return false;
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

/** camelCase token name to its `--color-kebab-case` custom property. */
export const toCssVar = (token: string): string =>
  `--color-${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

/**
 * Validates an active-theme payload from the API.
 *
 * Every one of the 38 tokens must be present and a safe colour — a partial or
 * malformed payload returns `null` and the site keeps its built-in defaults
 * instead of rendering half-themed markup.
 */
export const validateThemeTokens = (raw: unknown): ThemeTokens | null => {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const tokens: Partial<ThemeTokens> = {};
  for (const token of THEME_TOKENS) {
    const value = record[token];
    if (!isSafeColor(value)) return null;
    tokens[token] = value.trim();
  }
  return tokens as ThemeTokens;
};
