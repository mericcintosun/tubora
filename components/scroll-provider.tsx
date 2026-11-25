"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { TUBES } from "@/lib/data";
import { rgbCss } from "@/lib/color";
import { cn } from "@/lib/utils";

/**
 * Kit K3, signature 1: a scroll progress bar drawn as the tube rack itself: all 16 catalog
 * pigments, squeezed out left to right as the page scrolls. Dependency-free: native scroll
 * plus a small rAF spring for the bar; motion is skipped under prefers-reduced-motion.
 */
export function ScrollProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TubeRackProgress />
      {children}
    </>
  );
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function TubeRackProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let current = 0;
    let target = 0;
    let frame = 0;

    const read = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    const paint = () => {
      if (barRef.current) barRef.current.style.transform = `scaleX(${current})`;
    };
    const tick = () => {
      current += (target - current) * 0.2;
      if (Math.abs(target - current) < 0.001) {
        current = target;
        frame = 0;
      } else {
        frame = requestAnimationFrame(tick);
      }
      paint();
    };
    const onScroll = () => {
      read();
      if (prefersReducedMotion()) {
        current = target;
        paint();
      } else if (!frame) {
        frame = requestAnimationFrame(tick);
      }
    };

    read();
    current = target;
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 h-2 border-t-2 border-border bg-background"
      role="progressbar"
      aria-label="Page scroll progress"
    >
      <div ref={barRef} className="flex h-full origin-left" style={{ transform: "scaleX(0)" }}>
        {TUBES.map((t) => (
          <span key={t.id} className="h-full flex-1" style={{ backgroundColor: rgbCss(t.rgb) }} title={t.name} />
        ))}
      </div>
    </div>
  );
}

/** In-page anchor that scrolls smoothly (instantly under reduced motion), offset for the sticky header. */
export function AnchorLink({ href, className, children }: { href: `#${string}`; className?: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(className)}
      onClick={(e) => {
        const el = document.querySelector(href);
        if (!el) return;
        e.preventDefault();
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
        history.replaceState(null, "", href);
      }}
    >
      {children}
    </Link>
  );
}
