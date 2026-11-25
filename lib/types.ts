// Shared, JSON-safe contracts between the adapter, the API routes and the server pages.

import type { ErrorCode } from "./errors";
import type { PainterPhrase } from "./phrases";

export type AdapterMode = "fake" | "real";

/** "km-rgb": per-channel Kubelka-Munk estimate (fake). "spectral": spectral.js reflectance mixing (real). */
export type MixEngine = "km-rgb" | "spectral";

export type ApiResponse<T> =
  | { ok: true; mode: AdapterMode; data: T }
  | { ok: false; mode: AdapterMode; error: ErrorCode; hint: string };

export interface SceneSummary {
  id: string;
  title: string;
  challenge: string;
}

export type RgbTriple = [number, number, number];

export interface PlanRecipe {
  /** Average color of one cluster in the picture. */
  clusterRgb: RgbTriple;
  /** Best mix the packed tubes can reach for that cluster. */
  mixRgb: RgbTriple;
  /** Recipe text, for example "White 2 : Cad Red 1". */
  recipe: string;
  /** CIEDE2000 between cluster and mix. */
  error: number;
  /** Share of the picture this cluster covers (0 to 1). */
  weight: number;
}

export interface PlanSaved {
  painter: string;
  city: string;
  savedAt: string;
  note: string;
}

/** One palette plan as the shared result page reads it. */
export interface PlanSummary {
  id: string;
  sceneId: string;
  k: number;
  /** Tube ids the painter owns. */
  owned: string[];
  /** Tube ids the planner packed, in pick order. */
  selected: string[];
  /** Biggest areas first. */
  recipes: PlanRecipe[];
  avgError: number;
  unreachableShare: number;
  suggestion: { tubeId: string; avgErrorAfter: number } | null;
  saved: PlanSaved | null;
  /** Which mixing engine built the mix table behind these recipes. */
  mixEngine: MixEngine;
}

export type PhraseRow = PainterPhrase;
export type { PainterPhrase };

export interface AdaptionEvaluation {
  status: string;
  quality: { score_before: number; score_after: number; improvement_percent: number } | null;
}
