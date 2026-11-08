/**
 * Shared contracts for website themes.
 *
 * These mirror `backend/src/models/theme.model.ts` and
 * `backend/src/schemas/theme.schema.ts`; keep the two in sync.
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

export interface ThemeTokenGroup {
  label: string;
  hint: string;
  tokens: readonly ThemeToken[];
}

export interface Theme {
  _id: string;
  name: string;
  slug: string;
  description: string;
  tokens: ThemeTokens;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/** Response body of GET /themes (admin). */
export interface ThemeListResponse {
  items: Theme[];
  tokenGroups: ThemeTokenGroup[];
  defaultTokens: ThemeTokens;
}

/** Body accepted by POST /themes. */
export interface CreateThemePayload {
  name: string;
  slug: string;
  description?: string;
  tokens: ThemeTokens;
  isActive: boolean;
}

/** Body accepted by PUT /themes/:id — whole-document replacement. */
export interface ReplaceThemePayload extends CreateThemePayload {
  expectedVersion?: number;
}

/** Body accepted by PATCH /themes/:id — intentional partial update. */
export interface UpdateThemePayload {
  name?: string;
  slug?: string;
  description?: string;
  tokens?: ThemeTokens;
  isActive?: boolean;
  expectedVersion?: number;
}
