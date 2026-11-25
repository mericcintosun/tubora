// The only file that reads ADAPTER_MODE. Everything else asks adapterMode() or takes the
// engine as a plain prop. The numeric constants are plain values, safe to import anywhere.

import type { AdapterMode } from "./types";

/** "real" only for the exact string "real"; anything else (including unset) is "fake". */
export function adapterMode(): AdapterMode {
  return process.env.ADAPTER_MODE === "real" ? "real" : "fake";
}

export const MIX_ENGINE_BY_MODE = { fake: "km-rgb", real: "spectral" } as const;

/** Parts per mix on the planner grid. Documentation and the proof script only; the planner keeps its own loops. */
export const MIX_GRID_PARTS = 6;

export const WORKER_TIMEOUT_MS = 4000;
export const WORKER_RETRIES = 1;
export const MODEL_LOAD_TIMEOUT_MS = 30000;
export const MODEL_LOAD_RETRIES = 1;
export const PROOF_TIMEOUT_MS = 90000;

export const CORE_LOG_PREFIX = "[core]";
