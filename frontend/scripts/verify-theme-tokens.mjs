/**
 * Theme-token contract check.
 *
 * Fails (exit 1) when the three token sources drift apart:
 *
 *   1. `backend/src/models/theme.model.ts`  — DEFAULT_THEME_TOKENS (source of truth)
 *   2. `frontend/src/index.css` `:root`    — CSS fallbacks rendered before any API call
 *   3. every `var(--color-*)` used in `frontend/src/**` must be defined in `:root`
 *
 * Run: npm run verify:tokens
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const FRONTEND = fileURLToPath(new URL("..", import.meta.url));
const BACKEND_MODEL = fileURLToPath(
  new URL("../../backend/src/models/theme.model.ts", import.meta.url),
);

const errors = [];

/** camelCase token name to `--color-kebab-case`. */
const toVar = (name) =>
  `--color-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

// ---------------------------------------------------------------- backend ---
const backendSource = readFileSync(BACKEND_MODEL, "utf8");
const defaultsBlock = backendSource.match(
  /export const DEFAULT_THEME_TOKENS: ThemeTokens = \{([\s\S]*?)\n\};/,
)?.[1];
if (!defaultsBlock) {
  errors.push("Could not locate DEFAULT_THEME_TOKENS in the backend model.");
}

const backendDefaults = new Map();
if (defaultsBlock) {
  for (const line of defaultsBlock.split("\n")) {
    const m = line.match(/^\s*(\w+):\s*"([^"]*)",/);
    if (m) backendDefaults.set(m[1], m[2]);
  }
}
if (backendDefaults.size === 0) {
  errors.push("DEFAULT_THEME_TOKENS parsed zero tokens.");
}

// ---------------------------------------------------------------- frontend ---
const css = readFileSync(join(FRONTEND, "src/index.css"), "utf8");
const rootBlock = css.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const cssTokens = new Map();
for (const line of rootBlock.split("\n")) {
  const m = line.match(/^\s*(--color-[\w-]+):\s*(.+);/);
  if (m) cssTokens.set(m[1], m[2].trim());
}

// 1. Every backend token must have a `:root` default (and vice versa).
for (const [name, value] of backendDefaults) {
  const varName = toVar(name);
  if (!cssTokens.has(varName)) {
    errors.push(`Missing \`${varName}\` in index.css :root (backend has token "${name}").`);
    continue;
  }
  if (normalise(cssTokens.get(varName)) !== normalise(value)) {
    errors.push(
      `Default mismatch for "${name}": index.css has \`${cssTokens.get(varName)}\`, backend has \`${value}\`.`,
    );
  }
}
for (const varName of cssTokens.keys()) {
  const camel = varName
    .replace(/^--color-/, "")
    .replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  if (!backendDefaults.has(camel)) {
    errors.push(`index.css defines \`${varName}\` which the backend model does not know about.`);
  }
}

// 2. Every `var(--color-*)` used in source must be defined.
const used = new Set();
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== "node_modules") walk(full);
    } else if (/\.tsx?$|\.css$/.test(entry)) {
      const source = readFileSync(full, "utf8");
      for (const m of source.matchAll(/var\((--color-[\w-]+)/g)) used.add(m[1]);
    }
  }
};
walk(join(FRONTEND, "src"));

for (const varName of used) {
  if (!cssTokens.has(varName) && !/^--color-(black|white)$/.test(varName)) {
    errors.push(`Source uses var(${varName}) but index.css :root does not define it.`);
  }
}

function normalise(value) {
  return value.replace(/\s+/g, "").toLowerCase();
}

if (errors.length > 0) {
  console.error("Theme token verification FAILED:\n");
  for (const error of errors) console.error(`  ✗ ${error}`);
  process.exit(1);
}

console.log(
  `Theme tokens OK: ${backendDefaults.size} backend tokens == ${cssTokens.size} CSS defaults; ` +
    `${used.size} distinct var(--color-*) references all defined.`,
);
