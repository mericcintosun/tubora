// Deterministic seed: copies the phrase sample rows into the file the app loads.
// Reads fixtures/phrases.sample.json, sorts by id, writes fixtures/phrases.json as
// 2-space JSON plus a trailing newline. Running it twice leaves the output byte-identical.
// Plain Node ESM, no dependencies.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "fixtures", "phrases.sample.json");
const out = join(root, "fixtures", "phrases.json");

const rows = JSON.parse(readFileSync(src, "utf8"));
if (!Array.isArray(rows)) {
  console.error("seed: fixtures/phrases.sample.json must hold a JSON array");
  process.exit(1);
}

rows.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
writeFileSync(out, JSON.stringify(rows, null, 2) + "\n", "utf8");
console.log(`seed: wrote ${rows.length} phrase rows to fixtures/phrases.json`);
