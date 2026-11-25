// ADAPTER_MODE=real: plans are built from a spectral.js mix table. Scenes, saved plans, phrase
// rows and the phrase evaluation are the same fixtures the fake adapter serves (Adaption rows
// through activePhrases() once scripts/adaption_invent.py has run). Only getAdapter() in
// lib/adapter.ts selects this; pages never import it.
// Every method reads lib/adapter.ts at call time, so the circular import between the two is safe.

import { buildPlan, fakeAdapter, type TuboraAdapter } from "./adapter";
import { CORE_LOG_PREFIX } from "./config";
import type { PlanSummary } from "./types";

/**
 * Same-file fallback for DEMO step 6: build the plan with spectral.js, and if that throws,
 * log once and build it with the km-rgb estimate. The fallback plan carries
 * mixEngine "km-rgb", so the result page badge names the engine that really answered.
 */
function planWithFallback(id: string): PlanSummary | null {
  try {
    return buildPlan(id, "spectral");
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`${CORE_LOG_PREFIX} real fallback getPlan id=${id} reason=${reason}`);
    return buildPlan(id, "km-rgb");
  }
}

export const realAdapter: TuboraAdapter = {
  mode: "real",
  mixEngine: "spectral",
  listScenes: () => fakeAdapter.listScenes(),
  listSavedPlans: () => fakeAdapter.listSavedPlans(),
  getPlan: (id) => planWithFallback(id),
  listPhrases: () => fakeAdapter.listPhrases(),
  getPhraseEvaluation: () => fakeAdapter.getPhraseEvaluation(),
};
