// GET /api/mix?tubes=ultramarine-blue,cadmium-yellow-light&parts=1,1[&engine=spectral]
// Mixes 2 or 3 tubes with the requested engine (default: the adapter's) and returns the
// km-rgb estimate beside it for comparison.

import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/adapter";
import { adapterMode } from "@/lib/config";
import { TUBES } from "@/lib/data";
import { apiError } from "@/lib/errors";
import { MIXERS } from "@/lib/mix/engines";
import { MixQuerySchema } from "@/lib/schemas";
import type { ApiResponse, MixEngine, RgbTriple } from "@/lib/types";

interface MixResult {
  engine: MixEngine;
  rgb: RgbTriple;
  recipe: string;
  kmRgb: RgbTriple;
}

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const parsed = MixQuerySchema.safeParse({
    tubes: sp.get("tubes") ?? undefined,
    parts: sp.get("parts") ?? undefined,
    engine: sp.get("engine") ?? undefined,
  });
  if (!parsed.success) {
    const { body, status } = apiError(
      "invalid_input",
      "Send tubes=<id>,<id>[,<id>] from the catalog and parts=<n>,<n>[,<n>] as positive whole numbers adding up to 12 or less.",
      adapterMode()
    );
    return NextResponse.json(body, { status });
  }

  const adapter = getAdapter();
  const engine = parsed.data.engine ?? adapter.mixEngine;
  const tubes = parsed.data.tubes.map((id) => TUBES.find((t) => t.id === id)!);
  const parts = parsed.data.parts;
  try {
    const colors = tubes.map((t) => t.rgb);
    const result: MixResult = {
      engine,
      rgb: MIXERS[engine](colors, parts),
      recipe: tubes.map((t, i) => `${t.short} ${parts[i]}`).join(" : "),
      kmRgb: MIXERS["km-rgb"](colors, parts),
    };
    const body: ApiResponse<MixResult> = { ok: true, mode: adapter.mode, data: result };
    return NextResponse.json(body, { status: 200 });
  } catch {
    const { body, status } = apiError("parse_failure", "The mixer could not read these tubes. Try another pair.", adapter.mode);
    return NextResponse.json(body, { status });
  }
}
