// The state triad for every demo route: skeleton, error and empty. Server-safe (no "use client"):
// RouteSkeleton and RouteEmptyState render on the server; RouteErrorState is rendered from the
// client error.tsx boundaries, which pass their reset() as onRetry.
// D16 candy: Card and Button from components/ui, 2px ink outlines, sticker shadow, round corners.
// Entrance is the one M3 keyframe through tubora-enter. No pulse, no new keyframe.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Static placeholder blocks shaped like the page that is loading. Readable with motion off. */
export function RouteSkeleton({ label, blocks = 3, className }: { label: string; blocks?: number; className?: string }) {
  return (
    <div className={cn("mx-auto max-w-6xl px-4 py-10", className)}>
      <div role="status" aria-live="polite" className="tubora-enter space-y-6">
        <Card className="p-8">
          <p className="font-display text-2xl font-semibold">{label}</p>
          <div aria-hidden="true" className="mt-4 h-4 w-2/3 rounded-full border-2 border-border bg-background" />
          <div aria-hidden="true" className="mt-3 h-4 w-1/2 rounded-full border-2 border-border bg-background" />
        </Card>
        <div aria-hidden="true" className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: blocks }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-28 rounded-2xl border-2 border-border bg-muted shadow-sticker",
                i % 2 ? "rotate-[0.6deg]" : "-rotate-[0.6deg]"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Error card with a retry. The error text itself is never printed. */
export function RouteErrorState({
  title = "Tubora dropped a tube",
  body = "Something went wrong while mixing this page. Try again, or go back to the sunset and pack from there.",
  onRetry,
}: {
  title?: string;
  body?: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24">
      <Card role="alert" className="tubora-enter -rotate-[0.5deg] p-8 text-center">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-[50ch] leading-relaxed">{body}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => onRetry()}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/pack?scene=marmara-dusk">Back to the sunset</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

/** Nothing to show yet, plus the one link that fills it. */
export function RouteEmptyState({
  title,
  body,
  ctaHref,
  ctaLabel,
  className,
}: {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
  className?: string;
}) {
  return (
    <Card role="status" className={cn("tubora-enter p-5", className)}>
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 max-w-[65ch] text-sm leading-relaxed">{body}</p>
      <Button asChild size="sm" className="mt-4">
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    </Card>
  );
}
