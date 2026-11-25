// npm run demo:reset: puts the demo back at its start state. Build-time only (run with tsx),
// so the fs write below is allowed; the app itself never writes files.
//   1. Rewrites fixtures/phrases.json from fixtures/phrases.sample.json with the exact
//      scripts/seed.mjs logic (sort by id, 2-space JSON plus a trailing newline).
//   2. Checks the demo data: the default scene exists, every saved plan resolves on the
//      spectral engine with at least one recipe, the step 5 phrase finds a hit.
//   3. Prints one fingerprint line so three runs can be compared by eye.
//   4. Exits 1 with a clear line when any check fails.
// There is no database, no migration and no on-chain state: nothing else to reset.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const STEP5_QUERY = "karın üstünde akşam gölgesi";

function fail(line: string): never {
  console.error(`demo:reset FAILED: ${line}`);
  process.exit(1);
}

function reseedPhrases(): number {
  const src = join(ROOT, "fixtures", "phrases.sample.json");
  const out = join(ROOT, "fixtures", "phrases.json");
  const rows: unknown = JSON.parse(readFileSync(src, "utf8"));
  if (!Array.isArray(rows)) fail("fixtures/phrases.sample.json must hold a JSON array");
  const list = rows as Array<{ id: string }>;
  list.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  writeFileSync(out, JSON.stringify(list, null, 2) + "\n", "utf8");
  return list.length;
}

async function main() {
  // 1. Phrase fixture first, so the modules imported below read the fresh file.
  const count = reseedPhrases();
  console.log(`demo:reset: wrote ${count} phrase rows to fixtures/phrases.json`);
  if (count < 1) fail("the phrase fixture is empty, step 5 would have nothing to search");

  const data = await import("../lib/data");
  const adapter = await import("../lib/adapter");
  const phrases = await import("../lib/phrases");

  // 2. Checks.
  if (!data.sceneById(data.DEFAULT_SCENE_ID)) fail(`default scene "${data.DEFAULT_SCENE_ID}" is missing from lib/data.ts`);

  const prints: string[] = [];
  for (const saved of data.SAVED_PLANS) {
    const plan = adapter.buildPlan(saved.id, "spectral");
    if (!plan) fail(`saved plan "${saved.id}" did not resolve`);
    if (plan.recipes.length < 1) fail(`saved plan "${saved.id}" resolved with no recipes`);
    prints.push(`${saved.id}=${plan.selected.join("+")}@${plan.avgError.toFixed(3)}`);
  }

  const hit = phrases.keywordSearch(STEP5_QUERY);
  if (!hit) fail(`keywordSearch("${STEP5_QUERY}") returned no phrase`);

  // 3. Fingerprint: same line on every run means the demo starts from the same place.
  console.log(`demo:reset fingerprint ${prints.join(" | ")}`);
  console.log(`demo:reset ok: ${data.SAVED_PLANS.length} saved plans, step 5 phrase "${hit.phrase.text}"`);
}

main().catch((e: unknown) => fail(e instanceof Error ? e.message : String(e)));
