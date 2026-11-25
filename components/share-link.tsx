"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type CopyState = "idle" | "copying" | "copied" | "failed";

/**
 * Copy-link control for a palette plan page, plus a plain link to open it.
 * Real path: the Clipboard API. Same-file fallback (copyFallback): when the browser blocks
 * the clipboard, the full URL is shown as selectable text so it can still be copied by hand.
 */
export function ShareLink({ path, openLabel }: { path: string; openLabel?: string }) {
  const [state, setState] = useState<CopyState>("idle");
  const [url, setUrl] = useState("");

  const copyFallback = (fullUrl: string) => {
    setUrl(fullUrl);
    setState("failed");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={state === "copying"}
        aria-busy={state === "copying"}
        onClick={async () => {
          if (state === "copying") return;
          const fullUrl = new URL(path, window.location.origin).toString();
          setState("copying");
          try {
            await navigator.clipboard.writeText(fullUrl);
            setState("copied");
            setTimeout(() => setState("idle"), 1800);
          } catch {
            copyFallback(fullUrl);
          }
        }}
      >
        {state === "copied" ? <Check /> : <Link2 />}
        {state === "copied"
          ? "Link copied"
          : state === "copying"
            ? "Copying..."
            : state === "failed"
              ? "Copy blocked, use the link"
              : "Copy share link"}
      </Button>
      {openLabel ? (
        <Button asChild variant="outline" size="sm">
          <Link href={path}>{openLabel}</Link>
        </Button>
      ) : null}
      {state === "failed" && url ? (
        <span
          role="status"
          className="tubora-enter block w-full select-all break-all rounded-2xl border-2 border-border bg-background px-3 py-2 text-xs font-bold"
        >
          {url}
        </span>
      ) : null}
    </div>
  );
}
