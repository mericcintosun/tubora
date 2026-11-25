// The Tubora planner: reference pixels -> OKLab k-means clusters -> Kubelka-Munk mix table
// over the tube catalog -> greedy pick of k tubes that minimises weighted CIEDE2000 error ->
// per-pixel error for the heatmap. Pure functions, runs on the server (result pages) and in
// the browser (workspace). TODO: move buildMixTable + analyze into a Web Worker for uploads.

import { deltaE2000, oklabToRgb, rgbToLab, rgbToOklab, type Lab, type RGB } from "./color";
import { CORE_LOG_PREFIX } from "./config";
import { DEFAULT_K, SCENES, TUBES, planById, sceneById, type Scene } from "./data";
import { MIXERS } from "./mix/engines";
import type { MixEngine } from "./types";

export const FRAME_W = 96;
export const FRAME_H = 64;
export const CLUSTERS = 24;
/** CIEDE2000 above this reads as a different color to a painter: painted red on the heatmap. */
export const UNREACHABLE = 6;

export interface Pixels {
  width: number;
  height: number;
  /** RGB triplets, row major. */
  data: Uint8ClampedArray;
}

/* ---------- procedural reference scenes ---------- */

export function renderScene(scene: Scene, width = FRAME_W, height = FRAME_H): Pixels {
  const data = new Uint8ClampedArray(width * height * 3);
  let seed = 7;
  const noise = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed / 0x7fffffff - 0.5) * 10;
  };
  const lerp = (a: RGB, b: RGB, t: number): RGB => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
  for (let y = 0; y < height; y++) {
    const fy = (y + 0.5) / height;
    for (let x = 0; x < width; x++) {
      const fx = (x + 0.5) / width;
      let c: RGB = [128, 128, 128];
      for (const L of scene.layers) {
        if (L.kind === "vgrad" && fy >= L.y0 && fy < L.y1) c = lerp(L.top, L.bottom, (fy - L.y0) / (L.y1 - L.y0));
        else if (L.kind === "disc" && Math.hypot((fx - L.cx) * 1.5, fy - L.cy) < L.r) c = L.color;
        else if (L.kind === "rect" && fx >= L.x0 && fx < L.x1 && fy >= L.y0 && fy < L.y1) {
          // broken reflection stripes
          if (Math.sin(fy * 90) > -0.2) c = L.color;
        } else if (L.kind === "ridge") {
          const edge = L.base + L.amp * Math.sin(fx * Math.PI * 2 * L.freq + L.phase);
          if (fy >= edge) c = lerp(L.top, L.bottom, Math.min(1, (fy - edge) / (1 - edge + 1e-6)));
        }
      }
      const i = (y * width + x) * 3;
      data[i] = c[0] + noise();
      data[i + 1] = c[1] + noise();
      data[i + 2] = c[2] + noise();
    }
  }
  return { width, height, data };
}

/** Downsample an uploaded image (RGBA from a canvas) into planner pixels. */
export function fromRgba(rgba: Uint8ClampedArray, width: number, height: number): Pixels {
  const data = new Uint8ClampedArray(width * height * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    data[j] = rgba[i];
    data[j + 1] = rgba[i + 1];
    data[j + 2] = rgba[i + 2];
  }
  return { width, height, data };
}

/* ---------- mix table ---------- */

export interface Mix {
  tubes: number[];
  parts: number[];
  mask: number;
  rgb: [number, number, number];
  lab: Lab;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

const tableCache: Partial<Record<MixEngine, Mix[]>> = {};

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/** Every 1, 2 and 3 tube mix on a 6-part grid across the full catalog (about 6,200 mixes), one table per engine. */
export function buildMixTable(engine: MixEngine = "km-rgb"): Mix[] {
  const cached = tableCache[engine];
  if (cached) return cached;
  const t0 = now();
  const mixer = MIXERS[engine];
  const n = TUBES.length;
  const mixes: Mix[] = [];
  const push = (tubes: number[], parts: number[]) => {
    const g = parts.reduce(gcd);
    const p = parts.map((x) => x / g);
    const rgb = tubes.length === 1 ? ([...TUBES[tubes[0]].rgb] as [number, number, number]) : mixer(tubes.map((t) => TUBES[t].rgb), p);
    mixes.push({ tubes, parts: p, mask: tubes.reduce((m, t) => m | (1 << t), 0), rgb, lab: rgbToLab(rgb) });
  };
  for (let a = 0; a < n; a++) {
    push([a], [1]);
    for (let b = a + 1; b < n; b++) {
      for (let pa = 1; pa < 6; pa++) push([a, b], [pa, 6 - pa]);
      for (let c = b + 1; c < n; c++) {
        for (let pa = 1; pa < 5; pa++) for (let pb = 1; pa + pb < 6; pb++) push([a, b, c], [pa, pb, 6 - pa - pb]);
      }
    }
  }
  tableCache[engine] = mixes;
  console.info(`${CORE_LOG_PREFIX} mix table built engine=${engine} mixes=${mixes.length} ms=${Math.round(now() - t0)}`);
  return mixes;
}

/* ---------- clustering ---------- */

export interface Cluster {
  rgb: [number, number, number];
  lab: Lab;
  weight: number;
}

export interface Analysis {
  pixels: Pixels;
  clusters: Cluster[];
  assign: Uint8Array;
  /** deltas[c * mixes + m] = CIEDE2000 between cluster c and mix m. */
  deltas: Float32Array;
  mixes: Mix[];
}

export function analyze(pixels: Pixels, k = CLUSTERS, engine: MixEngine = "km-rgb"): Analysis {
  const count = pixels.width * pixels.height;
  const ok: Lab[] = new Array(count);
  for (let i = 0; i < count; i++) ok[i] = rgbToOklab([pixels.data[i * 3], pixels.data[i * 3 + 1], pixels.data[i * 3 + 2]]);

  // deterministic k-means++ style seeding: spread starts by farthest point
  const centers: Lab[] = [ok[Math.floor(count / 2)]];
  const d2 = (p: Lab, q: Lab) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
  while (centers.length < k) {
    let best = 0;
    let bestD = -1;
    for (let i = 0; i < count; i += 3) {
      let m = Infinity;
      for (const c of centers) m = Math.min(m, d2(ok[i], c));
      if (m > bestD) {
        bestD = m;
        best = i;
      }
    }
    centers.push(ok[best]);
  }
  const assign = new Uint8Array(count);
  for (let iter = 0; iter < 10; iter++) {
    const sum = centers.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < count; i++) {
      let bi = 0;
      let bd = Infinity;
      for (let c = 0; c < k; c++) {
        const d = d2(ok[i], centers[c]);
        if (d < bd) {
          bd = d;
          bi = c;
        }
      }
      assign[i] = bi;
      const s = sum[bi];
      s[0] += ok[i][0];
      s[1] += ok[i][1];
      s[2] += ok[i][2];
      s[3]++;
    }
    for (let c = 0; c < k; c++) if (sum[c][3] > 0) centers[c] = [sum[c][0] / sum[c][3], sum[c][1] / sum[c][3], sum[c][2] / sum[c][3]];
  }
  const counts = new Array(k).fill(0);
  for (let i = 0; i < count; i++) counts[assign[i]]++;
  const clusters: Cluster[] = centers.map((c, i) => {
    const rgb = oklabToRgb(c);
    return { rgb, lab: rgbToLab(rgb), weight: counts[i] / count };
  });

  const mixes = buildMixTable(engine);
  const deltas = new Float32Array(k * mixes.length);
  for (let c = 0; c < k; c++) {
    if (clusters[c].weight === 0) continue;
    for (let m = 0; m < mixes.length; m++) deltas[c * mixes.length + m] = deltaE2000(clusters[c].lab, mixes[m].lab);
  }
  return { pixels, clusters, assign, deltas, mixes };
}

/* ---------- greedy tube selection ---------- */

export interface ClusterRecipe {
  cluster: Cluster;
  mix: Mix;
  error: number;
}

export interface PalettePlan {
  selected: number[];
  avgError: number;
  recipes: ClusterRecipe[];
  /** Share of pixels whose error is above UNREACHABLE. */
  unreachableShare: number;
  suggestion: { tube: number; avgError: number } | null;
  millis: number;
}

function bestPerCluster(a: Analysis, mask: number): { idx: number[]; err: number } {
  const M = a.mixes.length;
  const idx: number[] = [];
  let err = 0;
  for (let c = 0; c < a.clusters.length; c++) {
    let bi = -1;
    let bd = Infinity;
    if (a.clusters[c].weight > 0) {
      for (let m = 0; m < M; m++) {
        if ((a.mixes[m].mask & ~mask) !== 0) continue;
        const d = a.deltas[c * M + m];
        if (d < bd) {
          bd = d;
          bi = m;
        }
      }
      err += a.clusters[c].weight * bd;
    }
    idx.push(bi);
  }
  return { idx, err };
}

export function planPalette(a: Analysis, ownedIds: string[], k: number): PalettePlan {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const owned = TUBES.map((t, i) => (ownedIds.includes(t.id) ? i : -1)).filter((i) => i >= 0);
  let mask = 0;
  const selected: number[] = [];
  let err = Infinity;
  while (selected.length < Math.min(k, owned.length)) {
    let bestT = -1;
    let bestE = Infinity;
    for (const t of owned) {
      if (mask & (1 << t)) continue;
      const e = bestPerCluster(a, mask | (1 << t)).err;
      if (e < bestE) {
        bestE = e;
        bestT = t;
      }
    }
    if (bestT < 0) break;
    selected.push(bestT);
    mask |= 1 << bestT;
    err = bestE;
  }
  const { idx } = bestPerCluster(a, mask);
  const M = a.mixes.length;
  const recipes: ClusterRecipe[] = a.clusters
    .map((cluster, c) => ({ cluster, mix: a.mixes[idx[c]], error: idx[c] >= 0 ? a.deltas[c * M + idx[c]] : Infinity }))
    .filter((r) => r.cluster.weight > 0 && r.mix)
    .sort((x, y) => y.cluster.weight - x.cluster.weight);

  // which tube from the whole catalog would help most if added to this palette
  let suggestion: PalettePlan["suggestion"] = null;
  if (selected.length > 0) {
    for (let t = 0; t < TUBES.length; t++) {
      if (mask & (1 << t)) continue;
      const e = bestPerCluster(a, mask | (1 << t)).err;
      if (!suggestion || e < suggestion.avgError) suggestion = { tube: t, avgError: e };
    }
    if (suggestion && err - suggestion.avgError < 0.5) suggestion = null;
  }

  const errors = pixelErrors(a, idx);
  let bad = 0;
  for (let i = 0; i < errors.length; i++) if (errors[i] > UNREACHABLE) bad++;
  const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
  return {
    selected,
    avgError: Number.isFinite(err) ? err : 0,
    recipes,
    unreachableShare: bad / errors.length,
    suggestion,
    millis: t1 - t0,
  };
}

/**
 * Per-pixel error of a plan: each pixel carries the CIEDE2000 between its color group and the
 * best mix the packed tubes give that group. That is the palette's reach for the area the painter
 * actually mixes. Comparing each raw pixel with the mix instead also counted the sensor grain and
 * the spread inside each of the 24 groups, which no palette can close (even a perfect mix of the
 * group color left those pixels red), so the share disagreed with the recipe badges and the
 * average error shown next to it.
 */
function pixelErrors(a: Analysis, clusterMix: number[]): Float32Array {
  const count = a.pixels.width * a.pixels.height;
  const M = a.mixes.length;
  const out = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const c = a.assign[i];
    const m = clusterMix[c];
    if (m < 0) continue;
    out[i] = a.deltas[c * M + m];
  }
  return out;
}

/** Per-pixel error for a finished plan (the heatmap layer). */
export function planErrors(a: Analysis, plan: PalettePlan): Float32Array {
  const mask = plan.selected.reduce((m, t) => m | (1 << t), 0);
  return pixelErrors(a, bestPerCluster(a, mask).idx);
}

/** Closest mix to one target color using only the given tubes (used by phrase search). */
export function bestMixFor(rgb: RGB, tubeIdx: number[], engine: MixEngine = "km-rgb"): { mix: Mix; error: number } | null {
  const mask = tubeIdx.reduce((m, t) => m | (1 << t), 0);
  const lab = rgbToLab(rgb);
  let best: { mix: Mix; error: number } | null = null;
  for (const mix of buildMixTable(engine)) {
    if ((mix.mask & ~mask) !== 0) continue;
    const e = deltaE2000(lab, mix.lab);
    if (!best || e < best.error) best = { mix, error: e };
  }
  return best;
}

export function recipeText(mix: Mix): string {
  return mix.tubes.map((t, i) => `${TUBES[t].short} ${mix.parts[i]}`).join(" : ");
}

/* ---------- shareable ids ---------- */

export interface PlanSpec {
  sceneId: string;
  k: number;
  owned: string[];
}

/** `marmara-dusk.k4.1a3f` : scene, tube count, owned tubes as a hex bitmask over the catalog. */
export function encodePlanId(spec: PlanSpec): string {
  const mask = TUBES.reduce((m, t, i) => (spec.owned.includes(t.id) ? m | (1 << i) : m), 0);
  return `${spec.sceneId}.k${spec.k}.${mask.toString(16)}`;
}

export function resolvePlanId(id: string): (PlanSpec & { saved?: ReturnType<typeof planById> }) | null {
  const saved = planById(id);
  if (saved) return { sceneId: saved.sceneId, k: saved.k, owned: saved.owned, saved };
  const m = /^([a-z0-9-]+)\.k([1-9])\.([0-9a-f]{1,4})$/.exec(id);
  if (!m || !sceneById(m[1])) return null;
  const mask = parseInt(m[3], 16);
  const owned = TUBES.filter((_, i) => mask & (1 << i)).map((t) => t.id);
  if (owned.length === 0) return null;
  return { sceneId: m[1], k: Number(m[2]), owned };
}

export const defaultScene = () => SCENES[0];
export { DEFAULT_K };
