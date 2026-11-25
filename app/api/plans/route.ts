import { NextResponse } from "next/server";
import { getAdapter, type TuboraAdapter } from "@/lib/adapter";
import type { ApiResponse } from "@/lib/types";

type SavedPlans = ReturnType<TuboraAdapter["listSavedPlans"]>;

export function GET() {
  const adapter = getAdapter();
  const body: ApiResponse<SavedPlans> = { ok: true, mode: adapter.mode, data: adapter.listSavedPlans() };
  return NextResponse.json(body, { status: 200 });
}
