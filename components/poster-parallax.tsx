"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

/**
 * Kit K3, signature 2: parallax depth on the L1 poster. Three layers leave the screen at three
 * rates as the poster scrolls away: the headline (fastest, and its Fredoka weight eases from
 * 700 to 500), the strip of owned student-set tubes, and scene 1. The server HTML is the
 * resting state (y 0, weight 700), so it reads with JavaScript off. Under reduced motion no
 * motion value is bound and every layer stays where the layout put it.
 */
export function PosterParallax({
  headline,
  children,
  strip,
  scene,
}: {
  headline: string;
  /** Lede and CTA row, rendered on the server. */
  children: React.ReactNode;
  /** The owned tube swatches, rendered on the server from SEED. */
  strip: React.ReactNode;
  /** SceneSlot n={1}, rendered on the server. */
  scene: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const fontWeight = useTransform(scrollYProgress, [0, 0.6], [700, 500]);
  const headlineY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const stripY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, -24]);
  const still = reduce === true;

  return (
    <section ref={ref} className="relative mx-auto max-w-6xl px-4" aria-labelledby="poster-title">
      <div className="flex min-h-[calc(100svh-4rem)] flex-col justify-center py-12">
        {/* The M3 entrance sits on the wrapper: its fill-mode transform would override Motion's y on the h1. */}
        <div className="tubora-enter">
          <motion.h1
            id="poster-title"
            className="break-words font-display text-[clamp(3.5rem,9vw,8rem)] font-bold leading-[0.92] tracking-tight"
            style={still ? undefined : { fontWeight, y: headlineY }}
          >
            {headline}
          </motion.h1>
        </div>
        {children}
      </div>
      <motion.div className="pb-6" style={still ? undefined : { y: stripY }}>
        {strip}
      </motion.div>
      <motion.div className="pb-16 sm:pb-24" style={still ? undefined : { y: sceneY }}>
        {scene}
      </motion.div>
    </section>
  );
}
