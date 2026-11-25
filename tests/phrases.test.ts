// Corpus selection checks. Run with `npm test` (tsx --test tests/*.test.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { activePhrases, type PainterPhrase } from "../lib/phrases";

const row = (id: string, source: PainterPhrase["source"]): PainterPhrase => ({
  id,
  text: `phrase ${id}`,
  lang: "en",
  rgb: [120, 130, 180],
  hue: "blue-violet",
  value: "mid",
  chroma: "moderate",
  source,
  quality: source === "adaption-invent" ? 0.8 : null,
});

test("activePhrases returns only the Adaption rows when both kinds exist", () => {
  const rows = [row("a0001", "adaption-invent"), row("a0002", "adaption-invent"), row("p01", "seed-sample")];
  const out = activePhrases(rows);
  assert.equal(out.length, 2);
  assert.ok(out.every((r) => r.source === "adaption-invent"));
});

test("activePhrases returns the seed rows when there are no Adaption rows", () => {
  const rows = [row("p01", "seed-sample"), row("p02", "seed-sample")];
  const out = activePhrases(rows);
  assert.deepEqual(
    out.map((r) => r.id),
    ["p01", "p02"]
  );
  assert.ok(out.every((r) => r.source === "seed-sample"));
});
