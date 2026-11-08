import { Document, model, Schema, Types } from "mongoose";

/**
 * Website theme document.
 *
 * One theme = one set of design tokens (every colour the public site renders
 * with). Exactly one theme is `isActive`; a partial unique index enforces that
 * invariant at the database level so two themes can never fight over the
 * active slot.
 *
 * Tokens are plain CSS colour values (hex / rgb(a) / hsl(a) / named colour).
 * Gradients are NOT stored: the frontend composes them from these tokens with
 * `color-mix()`/`linear-gradient()` in `index.css`, which keeps the stored
 * payload a set of safe, easily-validated colours.
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

/** Groups drive the admin colour editor and the docs. */
export const THEME_TOKEN_GROUPS: { label: string; hint: string; tokens: readonly ThemeToken[] }[] = [
  {
    label: "Brand",
    hint: "Primary, secondary and accent colours, plus the base stops used by button gradients.",
    tokens: [
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
    ],
  },
  {
    label: "Surfaces",
    hint: "Page background, cards, muted panels and hover states.",
    tokens: [
      "background",
      "backgroundAlt",
      "surface",
      "surfaceRaised",
      "surfaceHover",
      "surfaceMuted",
      "surfaceSoft",
      "surfaceSoftHover",
      "surfacePill",
    ],
  },
  {
    label: "Borders",
    hint: "Dividers, card outlines and their hover strength.",
    tokens: ["border", "borderStrong", "borderSoft", "borderMuted", "borderFaint"],
  },
  {
    label: "Text",
    hint: "Headings, body copy, muted labels and text drawn on brand colours.",
    tokens: [
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
    ],
  },
  {
    label: "Effects",
    hint: "Focus ring, button shadow and accent glow.",
    tokens: ["focusRing", "shadowPrimary", "glowAccent"],
  },
];

/**
 * The shipped palette — byte-for-byte the colours the site was designed with,
 * so the default theme reproduces the existing visual identity exactly.
 * Keep in sync with `frontend/src/theme/tokens.ts`.
 */
export const DEFAULT_THEME_TOKENS: ThemeTokens = {
  primary: "#2F55F0",
  primaryDeep: "#4560F0",
  primaryStrong: "#2F4FE6",
  primarySoft: "#5A7CFB",
  primaryLight: "#88C7FF",
  primaryGlow: "#7B97FF",
  secondary: "#3B55E6",
  accent: "#3B66F5",
  accentStrong: "#3B82F6",
  accentSoft: "#8EC5FC",
  background: "#FDFDFD",
  backgroundAlt: "#FBFBFB",
  surface: "#FFFFFF",
  surfaceRaised: "#F9FAFB",
  surfaceHover: "#FAFCFF",
  surfaceMuted: "#F3F4F6",
  surfaceSoft: "#E9ECF2",
  surfaceSoftHover: "#E1E5EC",
  surfacePill: "#ECEFF3",
  border: "#E5E7EB",
  borderStrong: "#D1D5DB",
  borderSoft: "#CBD5E1",
  borderMuted: "#F0F2F5",
  borderFaint: "#EFEFEF",
  textPrimary: "#131A28",
  textHeading: "#111827",
  textBody: "#374151",
  textSubtle: "#4B5563",
  textSecondary: "#5B6478",
  textHero: "#5B6178",
  textMuted: "#6B7280",
  textFaint: "#9CA3AF",
  textNav: "#1A1D2E",
  textOnPrimary: "#FFFFFF",
  iconStrong: "#0F172A",
  focusRing: "rgba(47, 79, 230, 0.5)",
  // Matches the original primary-button shadow `rgba(47,79,230,0.28)` exactly,
  // so the default theme is byte-identical to the shipped palette.
  shadowPrimary: "rgba(47, 79, 230, 0.28)",
  glowAccent: "rgba(59, 102, 245, 0.7)",
};

export interface ITheme extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  tokens: ThemeTokens;
  isActive: boolean;
  /** Optimistic-concurrency token, incremented on every successful write. */
  version: number;
  user_id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/** One sub-document per token: keeps unknown keys out of stored documents. */
const tokensSchema = new Schema<ThemeTokens>(
  Object.fromEntries(
    THEME_TOKENS.map((token) => [
      token,
      { type: String, required: true, trim: true, minlength: 1, maxlength: 64 },
    ]),
  ),
  { _id: false },
);

const ThemeSchema = new Schema<ITheme>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      maxlength: 80,
    },
    description: { type: String, trim: true, maxlength: 300 },
    tokens: { type: tokensSchema, required: true },
    // No `index: true` here: the partial unique index below is the only index
    // on this field (a second definition would be dropped with a warning).
    isActive: { type: Boolean, required: true, default: false },
    version: { type: Number, required: true, default: 1 },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

/**
 * At most ONE active theme, guaranteed by the database rather than by
 * controller discipline alone.
 */
ThemeSchema.index(
  { isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } },
);

export const Theme = model<ITheme>("Theme", ThemeSchema);
export default Theme;
