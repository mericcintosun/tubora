"use client";

import { RouteErrorState } from "@/components/route-states";

export default function PackErrorState({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteErrorState
      title="The workspace dropped a tube"
      body="Something went wrong while packing the bag. Try again, or start over from the sunset."
      onRetry={() => reset()}
    />
  );
}
