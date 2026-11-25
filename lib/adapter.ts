// The data seam. Every server page and API route reads through getAdapter(), the only selector.
// ADAPTER_MODE=fake (the default) builds plans with the per-channel Kubelka-Munk estimate
// (km-rgb). ADAPTER_MODE=real (lib/adapter.real.ts) builds them with spectral.js reflectance
// mixing. Phrase rows and the evaluation stay on fixtures in both modes until Phase 4.
// The client workspace runs the same planner in the browser with the engine passed down as a prop.

import evaluationSample from "../fixtures/adaption-evaluation.sample.json";
import phraseFixture from "../fixtures/phrases.json";
import { adapterMode, CORE_LOG_PREFIX } from "./config";
import { TUBES, sceneById, type SavedPlan } from "./data";
import type { PainterPhrase } from "./phrases";
import { CLUSTERS, analyze, planPalette, recipeText, renderScene, resolvePlanId } from "./planner";
import { realAdapter } from "./adapter.real";
import { SEED } from "./seed";
import type { AdapterMode, AdaptionEvaluation, MixEngine, PlanSummary, SceneSummary } from "./types";

export interface TuboraAdapter {
  mode: AdapterMode;
  mixEngine: MixEngine;
  listScenes(): SceneSummary[];
  listSavedPlans(): SavedPlan[];
  getPlan(id: string): PlanSummary | null;
  listPhrases(): PainterPhrase[];
  getPhraseEvaluation(): AdaptionEvaluation;
}

const finite = (n: number) => (Number.isFinite(n) ? n : 0);

export function buildPlan(id: string, engine: MixEngine): PlanSummary | null {
  const spec = resolvePlanId(id);
  const scene = spec ? sceneById(spec.sceneId) : null;
  if (!spec || !scene) return null;

  const analysis = analyze(renderScene(scene), CLUSTERS, engine);
  const plan = planPalette(analysis, spec.owned, spec.k);
  const saved = spec.saved;
  const avgError = finite(plan.avgError);
  console.info(`${CORE_LOG_PREFIX} plan resolved id=${id} engine=${engine} avgError=${avgError.toFixed(2)}`);

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
    avgError,
    unreachableShare: finite(plan.unreachableShare),
    suggestion: plan.suggestion
      ? { tubeId: TUBES[plan.suggestion.tube].id, avgErrorAfter: finite(plan.suggestion.avgError) }
      : null,
    saved: saved ? { painter: saved.painter, city: saved.city, savedAt: saved.savedAt, note: saved.note } : null,
    mixEngine: engine,
  };
}

export const fakeAdapter: TuboraAdapter = {
  mode: "fake",
  mixEngine: "km-rgb",
  listScenes: () => SEED.scenes.map((s) => ({ id: s.id, title: s.title, challenge: s.challenge })),
  listSavedPlans: () => SEED.savedPlans,
  getPlan: (id) => buildPlan(id, "km-rgb"),
  listPhrases: () => phraseFixture as unknown as PainterPhrase[],
  getPhraseEvaluation: () => evaluationSample as AdaptionEvaluation,
};

/** The only adapter selector. Defaults to fake unless ADAPTER_MODE is exactly "real". */
export function getAdapter(): TuboraAdapter {
  return adapterMode() === "real" ? realAdapter : fakeAdapter;
}
