import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/adapter";
import type { AdaptionEvaluation, ApiResponse, PhraseRow } from "@/lib/types";

export function GET() {
  const adapter = getAdapter();
  const body: ApiResponse<{ rows: PhraseRow[]; evaluation: AdaptionEvaluation }> = {
    ok: true,
    mode: adapter.mode,
    data: { rows: adapter.listPhrases(), evaluation: adapter.getPhraseEvaluation() },
  };
  return NextResponse.json(body, { status: 200 });
}
