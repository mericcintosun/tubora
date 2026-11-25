// The data seam. Every server page and API route reads through getAdapter().
// ADAPTER_MODE=fake (the default) serves the seed in lib/seed.ts plus the fixtures and runs the
// planner on it. ADAPTER_MODE=real is reserved for Phase 2 and returns the same data for now.
// The client workspace still runs the planner in the browser: that is the engine, not a source.

import evaluationSample from "../fixtures/adaption-evaluation.sample.json";
import phraseFixture from "../fixtures/phrases.json";
import { TUBES, sceneById, type SavedPlan } from "./data";
import type { PainterPhrase } from "./phrases";
import { analyze, planPalette, recipeText, renderScene, resolvePlanId } from "./planner";
import { SEED } from "./seed";
import type { AdapterMode, AdaptionEvaluation, PlanSummary, SceneSummary } from "./types";

export interface TuboraAdapter {
  mode: AdapterMode;
  listScenes(): SceneSummary[];
  listSavedPlans(): SavedPlan[];
  getPlan(id: string): PlanSummary | null;
  listPhrases(): PainterPhrase[];
  getPhraseEvaluation(): AdaptionEvaluation;
}

const finite = (n: number) => (Number.isFinite(n) ? n : 0);

function buildPlan(id: string): PlanSummary | null {
  const spec = resolvePlanId(id);
  const scene = spec ? sceneById(spec.sceneId) : null;
  if (!spec || !scene) return null;

  const analysis = analyze(renderScene(scene));
  const plan = planPalette(analysis, spec.owned, spec.k);
  const saved = spec.saved;

  return {
    id,
    sceneId: scene.id,
    k: spec.k,
    owned: [...spec.owned],
    selected: plan.selected.map((t) => TUBES[t].id),
    recipes: plan.recipes.map((r) => ({
      clusterRgb: [r.cluster.rgb[0], r.cluster.rgb[1], r.cluster.rgb[2]],
      mixRgb: [r.mix.rgb[0], r.mix.rgb[1], r.mix.rgb[2]],
      recipe: recipeText(r.mix),
      error: finite(r.error),
      weight: r.cluster.weight,
    })),
    avgError: finite(plan.avgError),
    unreachableShare: finite(plan.unreachableShare),
    suggestion: plan.suggestion
      ? { tubeId: TUBES[plan.suggestion.tube].id, avgErrorAfter: finite(plan.suggestion.avgError) }
      : null,
    saved: saved ? { painter: saved.painter, city: saved.city, savedAt: saved.savedAt, note: saved.note } : null,
  };
}

export const fakeAdapter: TuboraAdapter = {
  mode: "fake",
  listScenes: () => SEED.scenes.map((s) => ({ id: s.id, title: s.title, challenge: s.challenge })),
  listSavedPlans: () => SEED.savedPlans,
  getPlan: buildPlan,
  listPhrases: () => phraseFixture as unknown as PainterPhrase[],
  getPhraseEvaluation: () => evaluationSample as AdaptionEvaluation,
};

export function getAdapter(): TuboraAdapter {
  if (process.env.ADAPTER_MODE === "real") {
    // Phase 2: spectral.js mix table + Adaption Invent rows
    return { ...fakeAdapter, mode: "real" };
  }
  return fakeAdapter;
}
