// One mixer per engine, same signature. "km-rgb" is the permanent fake engine (lib/color.ts),
// "spectral" is the real one (spectral.js, lib/mix/spectral.ts).

import { kmMix, type RGB } from "../color";
import type { MixEngine } from "../types";
import { spectralMix } from "./spectral";

export type Mixer = (colors: readonly RGB[], parts: readonly number[]) => [number, number, number];

export const MIXERS: Record<MixEngine, Mixer> = {
  "km-rgb": kmMix,
  spectral: spectralMix,
};

/** The mode line under the error readout, workspace and result page alike. */
export const ENGINE_LINE: Record<MixEngine, string> = {
  spectral: "Live engine: spectral.js reflectance mixing, computed in your browser.",
  "km-rgb": "Estimate engine: three-channel Kubelka-Munk. Spectral mixing is off in this build.",
};
