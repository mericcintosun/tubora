"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Copy-link control for a palette plan page, plus a plain link to open it. */
export function ShareLink({ path, openLabel }: { path: string; openLabel?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(new URL(path, window.location.origin).toString());
            setState("copied");
            setTimeout(() => setState("idle"), 1800);
          } catch {
            setState("failed");
          }
        }}
      >
        {state === "copied" ? <Check /> : <Link2 />}
        {state === "copied" ? "Link copied" : state === "failed" ? "Copy blocked, use the link" : "Copy share link"}
      </Button>
      {openLabel ? (
        <Button asChild variant="outline" size="sm">
          <Link href={path}>{openLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
