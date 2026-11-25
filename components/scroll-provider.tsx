"use client";

import Link from "next/link";
import { ReactLenis, useLenis } from "lenis/react";
import { motion, useReducedMotion, useScroll } from "motion/react";
import { TUBES } from "@/lib/data";
import { rgbCss } from "@/lib/color";
import { cn } from "@/lib/utils";

/**
 * Kit K3, signature 1. Lenis smooths the page scroll (never under prefers-reduced-motion),
 * and the progress bar is the tube rack itself: all 16 catalog pigments, squeezed out left
 * to right, bound to Motion's useScroll().scrollYProgress.
 *
 * Lenis is mounted as a childless sibling root so turning it on after hydration never
 * remounts the page; useLenis() reads the root instance from anywhere.
 */
export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <>
      {reduce === false && <ReactLenis root options={{ lerp: 0.12 }} />}
      <TubeRackProgress />
      {children}
    </>
  );
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function TubeRackProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 h-2 border-t-2 border-border bg-background"
      role="presentation"
      aria-hidden="true"
    >
      <motion.div className="flex h-full origin-left" style={{ scaleX: scrollYProgress }}>
        {TUBES.map((t) => (
          <span key={t.id} className="h-full flex-1" style={{ backgroundColor: rgbCss(t.rgb) }} />
        ))}
      </motion.div>
    </div>
  );
}

/** In-page anchor: Lenis scrollTo when Lenis is mounted, a native scroll otherwise, offset for the sticky header. */
export function AnchorLink({ href, className, children }: { href: `#${string}`; className?: string; children: React.ReactNode }) {
  const lenis = useLenis();
  return (
    <Link
      href={href}
      className={cn(className)}
      onClick={(e) => {
        const el = document.querySelector(href);
        if (!el) return;
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(href, { offset: -80 });
        } else {
          const top = el.getBoundingClientRect().top + window.scrollY - 80;
          const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
          window.scrollTo({ top, behavior });
        }
        history.replaceState(null, "", href);
      }}
    >
      {children}
    </Link>
  );
}
