// Error codes every API route answers with: { ok: false, mode, error, hint }.

import type { AdapterMode } from "./types";

export type ErrorCode =
  | "invalid_input"
  | "not_found"
  | "upstream_timeout"
  | "upstream_error"
  | "parse_failure"
  | "not_configured";

export const ERROR_STATUS: Record<ErrorCode, number> = {
  invalid_input: 400,
  not_found: 404,
  upstream_timeout: 504,
  upstream_error: 502,
  parse_failure: 500,
  not_configured: 503,
};

export interface ApiErrorBody {
  ok: false;
  mode: AdapterMode;
  error: ErrorCode;
  hint: string;
}

/** Builds the failure body and its HTTP status. Pass both to NextResponse.json. */
export function apiError(code: ErrorCode, hint: string, mode: AdapterMode): { body: ApiErrorBody; status: number } {
  return { body: { ok: false, mode, error: code, hint }, status: ERROR_STATUS[code] };
}
