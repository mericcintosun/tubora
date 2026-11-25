// The seed the fake adapter serves. Fixed ids, no random values, no clock.
// Lives at lib/seed.ts (not lib/data/seed.ts) so a lib/data/ folder never shadows @/lib/data.

import {
  DEFAULT_K,
  DEFAULT_SCENE_ID,
  SAVED_PLANS,
  SCENES,
  STUDENT_SET,
  TUBES,
  type SavedPlan,
  type Scene,
  type Tube,
} from "./data";
import { PHRASES, type PainterPhrase } from "./phrases";

export interface Seed {
  tubes: Tube[];
  scenes: Scene[];
  savedPlans: SavedPlan[];
  studentSet: string[];
  defaultSceneId: string;
  defaultK: number;
  phrases: PainterPhrase[];
}

export const SEED: Seed = {
  tubes: TUBES,
  scenes: SCENES,
  savedPlans: SAVED_PLANS,
  studentSet: STUDENT_SET,
  defaultSceneId: DEFAULT_SCENE_ID,
  defaultK: DEFAULT_K,
  phrases: PHRASES,
};

export { DEFAULT_K, DEFAULT_SCENE_ID, STUDENT_SET };
