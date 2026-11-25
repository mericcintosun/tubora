// Painter color phrases: the corpus behind "describe a color, get a recipe".
// Target state: about 600 rows in English, Turkish and Spanish produced by Adaption Invent
// with scripts/adaption_invent.py, scored with Adaption's evaluation, and pasted here as
// `source: "adaption-invent"` rows with their quality score.
// Current state: the 18 rows in fixtures/phrases.json are hand-written seed samples in the
// same shape, so the search runs today. They are labelled as samples in the UI and carry no
// quality score. Edit fixtures/phrases.sample.json, then run `npm run seed`.

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
  /** Adaption evaluation score (0-1) for generated rows; null for seed samples. */
  quality: number | null;
}

export const PHRASES: PainterPhrase[] = phraseRows as unknown as PainterPhrase[];

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
