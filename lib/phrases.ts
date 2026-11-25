// Painter color phrases: the corpus behind "describe a color, get a recipe".
// Target state: about 600 rows in English, Turkish and Spanish produced by Adaption Invent
// with scripts/adaption_invent.py, scored with Adaption's evaluation, and pasted here as
// `source: "adaption-invent"` rows with their quality score.
// Current state: the 18 rows below are hand-written seed samples in the same shape, so the
// search runs today. They are labelled as samples in the UI and carry no quality score.

import type { RGB } from "./color";

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

export const PHRASES: PainterPhrase[] = [
  { id: "p01", text: "evening shadow on snow", lang: "en", rgb: [128, 132, 184], hue: "blue-violet", value: "mid", chroma: "moderate", source: "seed-sample", quality: null },
  { id: "p02", text: "karın üstünde akşam gölgesi", lang: "tr", rgb: [124, 128, 182], hue: "blue-violet", value: "mid", chroma: "moderate", source: "seed-sample", quality: null },
  { id: "p03", text: "sombra de tarde sobre la nieve", lang: "es", rgb: [132, 136, 188], hue: "blue-violet", value: "mid", chroma: "moderate", source: "seed-sample", quality: null },
  { id: "p04", text: "sunset sky just above the sea", lang: "en", rgb: [240, 132, 44], hue: "orange", value: "light", chroma: "vivid", source: "seed-sample", quality: null },
  { id: "p05", text: "denizin hemen üstündeki gün batımı", lang: "tr", rgb: [236, 124, 40], hue: "orange", value: "light", chroma: "vivid", source: "seed-sample", quality: null },
  { id: "p06", text: "silver underside of olive leaves", lang: "en", rgb: [150, 160, 136], hue: "grey-green", value: "mid", chroma: "muted", source: "seed-sample", quality: null },
  { id: "p07", text: "zeytin yaprağının gümüşi altı", lang: "tr", rgb: [146, 158, 132], hue: "grey-green", value: "mid", chroma: "muted", source: "seed-sample", quality: null },
  { id: "p08", text: "cool shadow side of a cheek", lang: "en", rgb: [160, 112, 104], hue: "red-brown", value: "mid", chroma: "muted", source: "seed-sample", quality: null },
  { id: "p09", text: "mejilla en sombra fría", lang: "es", rgb: [156, 108, 102], hue: "red-brown", value: "mid", chroma: "muted", source: "seed-sample", quality: null },
  { id: "p10", text: "wet asphalt after rain", lang: "en", rgb: [62, 64, 70], hue: "neutral", value: "dark", chroma: "muted", source: "seed-sample", quality: null },
  { id: "p11", text: "yağmurdan sonra ıslak asfalt", lang: "tr", rgb: [60, 62, 68], hue: "neutral", value: "dark", chroma: "muted", source: "seed-sample", quality: null },
  { id: "p12", text: "harbour fog at seven in the morning", lang: "en", rgb: [184, 186, 190], hue: "neutral", value: "light", chroma: "muted", source: "seed-sample", quality: null },
  { id: "p13", text: "sabah sisinde liman", lang: "tr", rgb: [180, 182, 188], hue: "neutral", value: "light", chroma: "muted", source: "seed-sample", quality: null },
  { id: "p14", text: "dry ochre earth at noon", lang: "en", rgb: [196, 156, 98], hue: "yellow-orange", value: "mid", chroma: "moderate", source: "seed-sample", quality: null },
  { id: "p15", text: "tierra ocre seca al mediodía", lang: "es", rgb: [192, 152, 94], hue: "yellow-orange", value: "mid", chroma: "moderate", source: "seed-sample", quality: null },
  { id: "p16", text: "deep sea under a dusk sky", lang: "en", rgb: [44, 40, 84], hue: "violet-blue", value: "dark", chroma: "moderate", source: "seed-sample", quality: null },
  { id: "p17", text: "clear sky high overhead in summer", lang: "en", rgb: [90, 140, 204], hue: "blue", value: "mid", chroma: "vivid", source: "seed-sample", quality: null },
  { id: "p18", text: "warm lamp light on a white wall", lang: "en", rgb: [244, 214, 168], hue: "yellow-orange", value: "light", chroma: "muted", source: "seed-sample", quality: null },
];

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
