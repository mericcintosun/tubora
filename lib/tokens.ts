// IDENTITY.md (D16 candy) hexes as constants, for places that cannot read CSS variables
// (the OG image renderer). app/globals.css stays the single CSS token file; keep both in step.

export const GROUND = "#fde8e4";
export const SURFACE = "#fbd5cf";
export const DEEP = "#f7c1ba";
export const LINE = "#2a1a1f";
export const INK = "#2a1a1f";
export const ACCENT = "#d93a25";
export const ON_ACCENT = "#ffffff";
export const SECOND = "#e2a400";
export const OK = "#1f7a3d";
export const WARN = "#8a5a00";
export const BAD = "#b3261e";

export const TOKENS = { GROUND, SURFACE, DEEP, LINE, INK, ACCENT, ON_ACCENT, SECOND, OK, WARN, BAD } as const;
