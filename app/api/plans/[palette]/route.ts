import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/adapter";
import { adapterMode } from "@/lib/config";
import { apiError } from "@/lib/errors";
import { PaletteParamSchema } from "@/lib/schemas";
import type { ApiResponse, PlanSummary } from "@/lib/types";

export async function GET(_request: Request, { params }: { params: Promise<{ palette: string }> }) {
  const { palette } = await params;
  const parsed = PaletteParamSchema.safeParse(palette);
  if (!parsed.success) {
    const { body, status } = apiError(
      "invalid_input",
      "A palette is a saved slug like marmara-dusk-four-tubes or an id like marmara-dusk.k4.1a3f.",
      adapterMode()
    );
    return NextResponse.json(body, { status });
  }

  const adapter = getAdapter();
  const plan = adapter.getPlan(parsed.data);
  if (!plan) {
    const { body, status } = apiError("not_found", "No saved palette or valid plan id matches that name.", adapter.mode);
    return NextResponse.json(body, { status });
  }
  const body: ApiResponse<PlanSummary> = { ok: true, mode: adapter.mode, data: plan };
  return NextResponse.json(body, { status: 200 });
}
