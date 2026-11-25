// Minimal surface of spectral.js that lib/mix/spectral.ts calls. Written by hand because the
// package could not be inspected when this was added. lib/mix/spectral.ts reads every member
// defensively at runtime, so a mismatch here degrades to a logged fallback, not a crash.

declare module "spectral.js" {
  export class Color {
    constructor(input: string);
    toString(options?: { format?: string }): string;
    sRGB?: number[];
  }
  export function mix(...colors: Array<[Color, number]>): Color;
  const spectral: Record<string, unknown>;
  export default spectral;
}
