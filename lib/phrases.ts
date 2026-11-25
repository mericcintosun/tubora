// Painter color phrases: the corpus behind "describe a color, get a recipe".
// scripts/adaption_invent.py writes Adaption Invent rows (`source: "adaption-invent"`, ids
// a0001...) into fixtures/phrases.sample.json next to the 18 hand-written seed rows
// (`source: "seed-sample"`, ids p01...); `npm run seed` copies that file to fixtures/phrases.json.
// activePhrases() picks the corpus: the Adaption rows as soon as any exist, the seed rows
// otherwise. The UI labels which one answered.

import type { RGB } from "./color";
import phraseRows from "../fixtures/phrases.json";

export interface PainterPhrase {
  id: string;
  text: string;
  lang: "en" | "tr" | "es";
  rgb: RGB;
  hue: string;
  value: "dark" | "mid" | "light";
  chroma: "muted" | "moderate" | "vivid";
  source: "seed-sample" | "adaption-invent";
  /** Adaption evaluation score for generated rows; null for seed samples or while the evaluation is pending. */
  quality: number | null;
}

/** Adaption rows when any exist, otherwise the seed rows. Never mixes the two. */
export function activePhrases(rows: PainterPhrase[]): PainterPhrase[] {
  const generated = rows.filter((r) => r.source === "adaption-invent");
  return generated.length > 0 ? generated : rows.filter((r) => r.source !== "adaption-invent");
}

/** Every row in the fixture, both sources. Use PHRASES for search. */
export const ALL_PHRASES: PainterPhrase[] = phraseRows as unknown as PainterPhrase[];

export const PHRASES: PainterPhrase[] = activePhrases(ALL_PHRASES);

/** Deterministic fallback when the embedding model cannot load: shared-word overlap. */
export function keywordSearch(query: string): { phrase: PainterPhrase; score: number } | null {
  const words = (s: string) =>
    s
      .toLocaleLowerCase("tr")
      .replace(/[^\p{L}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);
  const q = new Set(words(query));
  if (q.size === 0) return null;
  let best: { phrase: PainterPhrase; score: number } | null = null;
  for (const phrase of PHRASES) {
    const w = words(phrase.text);
    const hits = w.filter((x) => q.has(x) || [...q].some((y) => y.startsWith(x.slice(0, 4)) || x.startsWith(y.slice(0, 4)))).length;
    const score = hits / Math.max(w.length, q.size);
    if (!best || score > best.score) best = { phrase, score };
  }
  return best && best.score > 0 ? best : null;
}
