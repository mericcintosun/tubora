"use client";

import { RouteErrorState } from "@/components/route-states";

export default function PaletteErrorState({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteErrorState
      title="This palette did not mix"
      body="Something went wrong while building the shared plan. Try again, or pack your own from the sunset."
      onRetry={() => reset()}
    />
  );
}
