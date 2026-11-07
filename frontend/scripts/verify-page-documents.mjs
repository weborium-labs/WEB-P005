/**
 * Live contract check for the public page API.
 *
 *   npm run verify:pages            # against http://localhost:5500/api/v1
 *   node scripts/verify-page-documents.mjs https://host/api/v1
 *
 * Bundles the exact validator the frontend renders with
 * (`src/lib/validatePageDocument.ts`), fetches every CMS page document and
 * reports whether the payload would be rendered or rejected — a rejected
 * payload is exactly the case where the static fallback stays on screen.
 * Requires the backend to be running.
 */
import { build } from "vite";

const baseUrl = process.argv[2] ?? process.env.API_BASE_URL ?? "http://localhost:5500/api/v1";

const slugs = [
  "home",
  "about",
  "contact",
  "footer",
  "site",
  "publications",
  "glimpses",
  "research-interests",
  "courses-taught",
  "mentorship",
  "patents",
  "editorial-board-memberships",
];

// Bundle the real validator (TypeScript) into an ESM module we can import.
const entry = new URL("../src/lib/validatePageDocument.ts", import.meta.url).pathname;
const bundled = await build({
  configFile: false,
  logLevel: "silent",
  build: {
    write: false,
    minify: false,
    target: "es2022",
    lib: { entry, formats: ["es"], fileName: () => "validatePageDocument.mjs" },
  },
});
const outputs = Array.isArray(bundled) ? bundled[0].output : bundled.output;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputs[0].code).toString("base64")}`;
const { validatePageDocument } = await import(moduleUrl);

let failures = 0;

for (const slug of slugs) {
  try {
    const response = await fetch(`${baseUrl}/pages/${encodeURIComponent(slug)}`);
    if (response.status === 404) {
      console.log(`  404  ${slug.padEnd(28)} -> not-found (static fallback)`);
      continue;
    }
    if (!response.ok) {
      failures += 1;
      console.log(`FAIL  ${slug.padEnd(28)} -> HTTP ${response.status}`);
      continue;
    }
    const envelope = await response.json();
    const document = validatePageDocument(envelope?.data ?? envelope);
    if (!document) {
      failures += 1;
      console.log(`FAIL  ${slug.padEnd(28)} -> rejected by validatePageDocument`);
      continue;
    }
    const sections = document.content.sections;
    console.log(
      `  ok  ${slug.padEnd(28)} -> v${document.version ?? "?"} ${document.status}, ` +
        `${sections.length} section(s): ${sections.map((s) => s.key).join(", ")}`,
    );
  } catch (error) {
    failures += 1;
    console.log(`FAIL  ${slug.padEnd(28)} -> ${error.message}`);
  }
}

console.log(failures === 0 ? "\nAll page documents are renderable." : `\n${failures} failure(s).`);
process.exit(failures === 0 ? 0 : 1);
