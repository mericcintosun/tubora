import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/adapter";
import type { ApiResponse, PlanSummary } from "@/lib/types";

export async function GET(_request: Request, { params }: { params: Promise<{ palette: string }> }) {
  const { palette } = await params;
  const adapter = getAdapter();
  const plan = adapter.getPlan(palette);
  if (!plan) {
    const missing: ApiResponse<PlanSummary> = { ok: false, mode: adapter.mode, error: "Palette not found" };
    return NextResponse.json(missing, { status: 404 });
  }
  const body: ApiResponse<PlanSummary> = { ok: true, mode: adapter.mode, data: plan };
  return NextResponse.json(body, { status: 200 });
}
