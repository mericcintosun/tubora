import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/adapter";
import type { ApiResponse, SceneSummary } from "@/lib/types";

export function GET() {
  const adapter = getAdapter();
  const body: ApiResponse<SceneSummary[]> = { ok: true, mode: adapter.mode, data: adapter.listScenes() };
  return NextResponse.json(body, { status: 200 });
}
