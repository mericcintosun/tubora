"use client";

import { RouteErrorState } from "@/components/route-states";

// The error itself is never printed: painters get a retry and a way back to the sunset.
export default function RootErrorState({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorState onRetry={() => reset()} />;
}
