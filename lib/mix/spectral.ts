// The real mixing engine: spectral.js turns each tube's sRGB color into a reflectance curve,
// mixes the curves with Kubelka-Munk and converts back to sRGB. This is the ONLY file that
// imports spectral.js. Every member is read defensively because the package surface was
// written against its README, not inspected (see types/spectral-js.d.ts and HANDOFF.md).

import * as spectralNs from "spectral.js";
import { kmMix, type RGB } from "../color";
import { CORE_LOG_PREFIX } from "../config";

type Triple = [number, number, number];
type Api = Record<string, unknown>;

// Passing the namespace through a plain record keeps the bundler from checking member names.
const ns = spectralNs as unknown as Api;

function resolveApi(): Api {
  if (typeof ns.mix === "function") return ns;
  const d = ns.default as Api | undefined;
  if (d && typeof d.mix === "function") return d;
  throw new Error("spectral.js exposes no mix function");
}

const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const toHex = (c: RGB) => "#" + c.map((v) => clamp255(v).toString(16).padStart(2, "0")).join("");

/** Reads a mix result in whatever shape the library returns: hex, rgb() string, or an sRGB array. */
function parseColor(out: unknown): Triple {
  const fromString = (s: string): Triple | null => {
    const hex = /^#?([0-9a-f]{6})$/i.exec(s.trim());
    if (hex) {
      const n = parseInt(hex[1], 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const rgb = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(s);
    if (rgb) return [clamp255(Number(rgb[1])), clamp255(Number(rgb[2])), clamp255(Number(rgb[3]))];
    return null;
  };
  if (typeof out === "string") {
    const t = fromString(out);
    if (t) return t;
  } else if (out && typeof out === "object") {
    const obj = out as { toString?: (o?: object) => string; sRGB?: unknown };
    // The library's own string output first: it is gamut mapped. A plain object prints
    // "[object Object]", which fails the parse and drops through to the sRGB array.
    if (typeof obj.toString === "function") {
      const t = fromString(String(obj.toString({ format: "hex" })));
      if (t) return t;
    }
    if (Array.isArray(obj.sRGB) && obj.sRGB.length >= 3) {
      const a = obj.sRGB.slice(0, 3).map(Number);
      const scale = a.every((v) => v <= 1.0001) ? 255 : 1;
      return [clamp255(a[0] * scale), clamp255(a[1] * scale), clamp255(a[2] * scale)];
    }
  }
  throw new Error("could not read the spectral.js mix result");
}

const colorCache = new Map<string, unknown>();

function mixWithLibrary(api: Api, colors: readonly RGB[], weights: readonly number[]): Triple {
  const ColorCtor = api.Color as (new (input: string) => unknown) | undefined;
  const mix = api.mix as (...args: unknown[]) => unknown;
  if (typeof ColorCtor === "function") {
    // spectral.js 3: mix([color, factor], [color, factor], ...) takes any number of colors.
    const pairs = colors.map((c, i) => {
      const hex = toHex(c);
      let color = colorCache.get(hex);
      if (!color) {
        color = new ColorCtor(hex);
        colorCache.set(hex, color);
      }
      return [color, weights[i]];
    });
    return parseColor(mix(...pairs));
  }
  // Older two-color API, mix(a, b, t): fold the colors in order with cumulative weights, so
  // A:B:C = 1:2:3 becomes mix(mix(A, B, 2/3), C, 3/6).
  let acc = toHex(colors[0]);
  let w = weights[0];
  for (let i = 1; i < colors.length; i++) {
    const t = weights[i] / (w + weights[i]);
    acc = toHex(parseColor(mix(acc, toHex(colors[i]), t)));
    w += weights[i];
  }
  return parseColor(acc);
}

let warned = false;
let lastError: string | null = null;

/** Null while spectral.js answers; otherwise the reason the km-rgb estimate stood in. */
export function spectralHealth(): string | null {
  return lastError;
}

/**
 * Weighted spectral mix of 1 to 3 tube colors. `parts` are relative amounts (2:1, 1:1:4, ...),
 * turned into factors that sum to 1. Returns 0 to 255 integers.
 */
export function spectralMix(colors: readonly RGB[], parts: readonly number[]): Triple {
  const used = colors.map((c, i) => ({ c, p: parts[i] ?? 0 })).filter((x) => x.p > 0);
  if (used.length === 0) return [0, 0, 0];
  if (used.length === 1) return [clamp255(used[0].c[0]), clamp255(used[0].c[1]), clamp255(used[0].c[2])];
  const total = used.reduce((s, x) => s + x.p, 0);
  try {
    return mixWithLibrary(
      resolveApi(),
      used.map((x) => x.c),
      used.map((x) => x.p / total)
    );
  } catch (err) {
    lastError = err instanceof Error ? err.message : "unknown spectral.js failure";
    if (!warned) {
      warned = true;
      console.warn(`${CORE_LOG_PREFIX} spectral fallback engine=km-rgb reason=${lastError}`);
    }
    return kmMix(colors, parts);
  }
}
