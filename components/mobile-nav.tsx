"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/pack/marmara-dusk-four-tubes", label: "A shared palette" },
  { href: "/how", label: "How it works" },
  { href: "/pack?scene=marmara-dusk", label: "Pack my tubes" },
];

/** Below md: a disclosure button that opens a solid sticker panel with every header link. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on route change.
  useEffect(() => setOpen(false), [pathname]);

  // Close on Escape and hand focus back to the button.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-border bg-background shadow-sticker focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 active:translate-y-[3px] active:shadow-none"
      >
        {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-4 top-[calc(100%+0.5rem)] z-50 rounded-2xl border-2 border-border bg-background p-3 shadow-sticker"
      >
        <ul className="flex flex-col gap-2">
          {LINKS.map((l) => {
            const target = l.href.split("?")[0];
            const active = pathname === target;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex min-h-11 items-center rounded-full border-2 border-transparent px-4 font-bold hover:bg-muted",
                    active && "border-border bg-muted"
                  )}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
