// ADAPTER_MODE=real: plans are built from a spectral.js mix table. Scenes, saved plans, phrase
// rows and the phrase evaluation are the same fixtures the fake adapter serves (Phase 4 makes
// the phrase rows real). Only getAdapter() in lib/adapter.ts selects this; pages never import it.
// Every method reads lib/adapter.ts at call time, so the circular import between the two is safe.

import { buildPlan, fakeAdapter, type TuboraAdapter } from "./adapter";

export const realAdapter: TuboraAdapter = {
  mode: "real",
  mixEngine: "spectral",
  listScenes: () => fakeAdapter.listScenes(),
  listSavedPlans: () => fakeAdapter.listSavedPlans(),
  getPlan: (id) => buildPlan(id, "spectral"),
  listPhrases: () => fakeAdapter.listPhrases(),
  getPhraseEvaluation: () => fakeAdapter.getPhraseEvaluation(),
};
