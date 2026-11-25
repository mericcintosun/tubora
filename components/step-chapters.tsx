"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

export interface ChapterSwatch {
  key: string;
  /** CSS color built with rgbCss() from seed or planner data. */
  css: string;
  label: string;
}

export interface Chapter {
  id: string;
  title: string;
  /** One sentence, numbers computed on the server. */
  body: string;
  swatches: ChapterSwatch[];
}

/**
 * Kit K3, signature 3: the three steps of a plan as chapters. On a wide enough scroll the
 * section pins under the header and vertical scroll drives the horizontal x of the track,
 * one chapter per viewport. Server HTML and reduced motion get a plain vertical list of
 * sections with headings, so nothing waits off screen for JavaScript and every chapter is
 * reachable by keyboard and screen reader.
 */
export function StepChapters({ chapters }: { chapters: Chapter[] }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-66.666%"]);
  const sideways = hydrated && reduce === false;

  const heading = (
    <h2 id="chapters-title" className="font-display text-3xl font-semibold sm:text-5xl">
      Three moves, one sunset
    </h2>
  );

  if (!sideways) {
    return (
      <section ref={ref} className="mx-auto max-w-6xl px-4 py-16 sm:py-24" aria-labelledby="chapters-title">
        {heading}
        <div className="mt-10 space-y-14">
          {chapters.map((c) => (
            <ChapterPanel key={c.id} chapter={c} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[300vh]" aria-labelledby="chapters-title">
      <div className="sticky top-16 flex h-[calc(100svh-4rem)] flex-col justify-center overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-4">{heading}</div>
        <motion.div className="mt-8 flex w-[300%]" style={{ x }}>
          {chapters.map((c) => (
            <div key={c.id} className="w-1/3 shrink-0">
              <div className="mx-auto max-w-6xl px-4">
                <ChapterPanel chapter={c} />
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ChapterPanel({ chapter }: { chapter: Chapter }) {
  const dense = chapter.swatches.length > 12;
  return (
    <section aria-labelledby={`chapter-${chapter.id}`}>
      <h3 id={`chapter-${chapter.id}`} className="font-display text-2xl font-semibold sm:text-4xl">
        {chapter.title}
      </h3>
      <p className="mt-3 max-w-[65ch] text-lg leading-relaxed">{chapter.body}</p>
      <ul
        className={cn(
          "mt-6 grid gap-2",
          dense ? "grid-cols-6 sm:grid-cols-8 lg:grid-cols-12" : "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6"
        )}
      >
        {chapter.swatches.map((s, i) => (
          <li key={s.key} className={cn("min-w-0", i % 2 ? "rotate-1" : "-rotate-1")}>
            <span
              className={cn("block rounded-xl border-2 border-border shadow-sticker", dense ? "aspect-square" : "h-16")}
              style={{ backgroundColor: s.css }}
              title={s.label}
            />
            {!dense && <span className="mt-2 block truncate text-sm font-bold">{s.label}</span>}
            {dense && <span className="sr-only">{s.label}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
