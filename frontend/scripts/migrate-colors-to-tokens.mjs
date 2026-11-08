/**
 * One-time colour to design-token migration for the public frontend.
 *
 * Rewrites hardcoded hex colours and colour utility classes under
 * `frontend/src` (ts + tsx) to `var(--color-*)` arbitrary values so the whole
 * site restyles from the active theme (`GET /api/v1/themes/active`, applied by
 * `src/theme/applyTheme.ts`).
 *
 * Rules (kept in sync with `src/index.css` and
 * `backend/src/models/theme.model.ts`):
 *
 *  - Only class strings / inline style values are rewritten. Raw SVG artwork
 *    attributes (fill, stroke, stopColor) are masked out first and left
 *    byte-identical: illustration artwork must not shift with a theme.
 *  - Black/neutral overlays (bg-black variants, ring-black/10, border-black/5,
 *    rgba(0,0,0,...) shadows) stay hardcoded: they are shading, not palette.
 *  - Status colours with no token (red-500, red-100) stay hardcoded.
 *  - Grey scale utilities map 1:1 onto the token palette (identical hexes).
 *  - Blue utilities map onto the nearest brand token (documented deltas:
 *    blue-100 to primary-light, blue-600 to accent-strong, blue-700 to
 *    primary-strong, blue-900 to text-primary).
 *
 * Usage: node scripts/migrate-colors-to-tokens.mjs   (add --dry-run to preview)
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../src", import.meta.url));
const DRY = process.argv.includes("--dry-run");

/** 6-digit hex to token (keys lowercase; matched case-insensitively). */
const HEX_TO_TOKEN = {
  // Brand
  "2f55f0": "primary",
  "4560f0": "primary-deep",
  "2f4fe6": "primary-strong",
  "5a7cfb": "primary-soft",
  "88c7ff": "primary-light",
  "7b97ff": "primary-glow",
  "3b55e6": "secondary",
  "3b66f5": "accent",
  "3b82f6": "accent-strong",
  "8ec5fc": "accent-soft",
  "93c5fd": "accent-soft",
  // Surfaces
  fdfdfd: "background",
  ffffff: "surface",
  f9fafb: "surface-raised",
  fafafa: "surface-raised",
  fafcff: "surface-hover",
  f3f4f6: "surface-muted",
  e9ecf2: "surface-soft",
  e1e5ec: "surface-soft-hover",
  eceff3: "surface-pill",
  // Borders
  e5e7eb: "border",
  d1d5db: "border-strong",
  cbd5e1: "border-soft",
  f0f2f5: "border-muted",
  efefef: "border-faint",
  // Text / icons
  "131a28": "text-primary",
  "111827": "text-heading",
  "1f2937": "text-heading",
  "374151": "text-body",
  "4b5563": "text-subtle",
  "5b6478": "text-secondary",
  "5b6178": "text-hero",
  "6b7280": "text-muted",
  "64748b": "text-muted",
  "9ca3af": "text-faint",
  "94a3b8": "text-faint",
  "8a93a6": "text-faint",
  "8c95a6": "text-faint",
  "1a1d2e": "text-nav",
  "1e293b": "text-primary",
  "0f172a": "icon-strong",
  // Effects
  e0e7ff: "primary-glow",
};

/** Tailwind grey utilities to token (grey hexes are byte-identical to tokens). */
const GREY_TO_TOKEN = {
  50: "surface-raised",
  100: "surface-muted",
  200: "border",
  300: "border-strong",
  400: "text-faint",
  500: "text-muted",
  600: "text-subtle",
  700: "text-body",
  800: "text-heading",
  900: "text-heading",
};

/** Tailwind blue utilities to nearest brand token. */
const BLUE_TO_TOKEN = {
  100: "primary-light",
  600: "accent-strong",
  700: "primary-strong",
  900: "text-primary",
};

/** `bg-white/30` becomes `bg-[var(--color-surface)]/30`, and so on. */
const KEYWORD_TO_TOKEN = {
  white: { bg: "surface", text: "text-on-primary", border: "surface", ring: "surface" },
  black: { text: "text-primary" },
};

const ATTR_MASK =
  /\b(fill|stroke|stopColor|stop-color|floodColor|lightingColor)\s*=\s*(["'])[^"']*\2/g;

const counts = new Map();
const bump = (key) => counts.set(key, (counts.get(key) ?? 0) + 1);

const maskAttributes = (line) => {
  const slots = [];
  const masked = line.replace(ATTR_MASK, (m) => {
    slots.push(m);
    return ` MASK${slots.length - 1} `;
  });
  return { masked, slots };
};

const unmaskAttributes = (line, slots) =>
  line.replace(/ MASK(\d+) /g, (_, i) => slots[Number(i)]);

const migrateLine = (line) => {
  const { masked, slots } = maskAttributes(line);
  let out = masked;

  // 1. Hex colours to var(--color-*).
  out = out.replace(/#([0-9a-fA-F]{6})\b/g, (match, hex) => {
    const token = HEX_TO_TOKEN[hex.toLowerCase()];
    if (!token) return match;
    bump(`hex #${hex.toLowerCase()} -> ${token}`);
    return `var(--color-${token})`;
  });

  // 2. Grey / blue utility classes to tokens (opacity suffix preserved).
  out = out.replace(
    /\b(bg|text|border|ring|stroke|fill|from|via|to|divide|decoration|placeholder)-(gray|blue)-(\d{1,3})(\/\d{1,3})?(?![\w-])/g,
    (match, verb, family, shade, opacity) => {
      const table = family === "gray" ? GREY_TO_TOKEN : BLUE_TO_TOKEN;
      const token = table[Number(shade)];
      if (!token) return match; // e.g. red-* or an unmapped shade
      bump(`${family}-${shade} -> ${token}`);
      return `${verb}-[var(--color-${token})]${opacity ?? ""}`;
    },
  );

  // 3. bg-white/30, text-black, ring-white, ... to tokens.
  out = out.replace(
    /\b(bg|text|border|ring)-(white|black)(\/\d{1,3})?(?![\w-])/g,
    (match, verb, colour, opacity) => {
      const token = KEYWORD_TO_TOKEN[colour]?.[verb];
      if (!token) return match; // e.g. stroke-white, bg-black variants
      bump(`${verb}-${colour} -> ${token}`);
      return `${verb}-[var(--color-${token})]${opacity ?? ""}`;
    },
  );

  return unmaskAttributes(out, slots);
};

const walk = (dir) => {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "theme" || entry === "node_modules") continue; // token module is authoritative
      files.push(...walk(full));
    } else if (/\.tsx?$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
};

for (const file of walk(ROOT)) {
  const source = readFileSync(file, "utf8");
  const migrated = source
    .split("\n")
    .map(migrateLine)
    .join("\n");
  if (migrated !== source) {
    console.log(`changed: ${relative(process.cwd(), file)}`);
    if (!DRY) writeFileSync(file, migrated);
  }
}

console.log("\nMapping summary:");
for (const [key, n] of [...counts].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${key}`);
}
if (DRY) console.log("\n(dry run - no files written)");
