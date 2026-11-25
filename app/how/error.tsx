"use client";

import { RouteErrorState } from "@/components/route-states";

export default function HowErrorState({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteErrorState
      title="The method page smudged"
      body="Something went wrong while rendering the method notes. Try again, or go straight to the sunset."
      onRetry={() => reset()}
    />
  );
}
