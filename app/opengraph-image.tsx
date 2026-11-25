import { ImageResponse } from "next/og";
import { ACCENT, GROUND, INK, ON_ACCENT, SECOND, SURFACE } from "@/lib/tokens";

export const alt = "Tubora: pick the tubes, see what you can't paint";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse cannot read CSS variables, so the IDENTITY.md palette comes from lib/tokens.ts.

export default function OpengraphImage() {
  const tubes = [ACCENT, SECOND, ON_ACCENT, INK];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: GROUND, padding: 72, color: INK }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, background: ACCENT, border: `6px solid ${INK}` }} />
          <div style={{ fontSize: 72, fontWeight: 700 }}>Tubora</div>
        </div>
        <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.05, maxWidth: 1000 }}>
          Four tubes in the bag. Know what you can&apos;t paint before you leave.
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {tubes.map((c, i) => (
            <div key={i} style={{ width: 90, height: 150, borderRadius: 20, background: c, border: `6px solid ${INK}`, boxShadow: `0 8px 0 ${INK}` }} />
          ))}
          <div style={{ display: "flex", alignItems: "center", marginLeft: 24, padding: "0 28px", borderRadius: 40, background: SURFACE, border: `6px solid ${INK}`, fontSize: 32 }}>
            recipes + unreachable-color heatmap
          </div>
        </div>
      </div>
    ),
    size
  );
}
