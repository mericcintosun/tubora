"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ReactLenis, useLenis } from "lenis/react";
import { motion, useScroll, useSpring } from "motion/react";
import { TUBES } from "@/lib/data";
import { rgbCss } from "@/lib/color";
import { cn } from "@/lib/utils";

/**
 * Kit K3, signature 1: a Lenis smooth-scrolling root plus a scroll progress bar.
 * The bar is the tube rack itself: all 16 catalog pigments, squeezed out left to right
 * as the page scrolls. Lenis is never mounted under prefers-reduced-motion.
 */
export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const [smooth, setSmooth] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSmooth(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <>
      {smooth ? <ReactLenis root options={{ lerp: 0.11, smoothWheel: true }}>{null}</ReactLenis> : null}
      <TubeRackProgress />
      {children}
    </>
  );
}

function TubeRackProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 160, damping: 30, mass: 0.3 });
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 h-2 border-t-2 border-border bg-background"
      role="progressbar"
      aria-label="Page scroll progress"
    >
      <motion.div className="flex h-full origin-left" style={{ scaleX }}>
        {TUBES.map((t) => (
          <span key={t.id} className="h-full flex-1" style={{ backgroundColor: rgbCss(t.rgb) }} title={t.name} />
        ))}
      </motion.div>
    </div>
  );
}

/** In-page anchor that rides Lenis when it is running and falls back to native scrolling. */
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
        if (lenis) lenis.scrollTo(el as HTMLElement, { offset: -80 });
        else el.scrollIntoView({ block: "start" });
        history.replaceState(null, "", href);
      }}
    >
      {children}
    </Link>
  );
}
