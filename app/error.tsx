"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// The error itself is never printed: painters get a retry and a way back to the sunset.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24">
      <Card role="alert" className="tubora-enter -rotate-[0.5deg] p-8 text-center">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">Tubora dropped a tube</h2>
        <p className="mx-auto mt-3 max-w-[50ch] leading-relaxed">
          Something went wrong while mixing this page. Try again, or go back to the sunset and pack from there.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => reset()}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/pack?scene=marmara-dusk">Back to the sunset</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
