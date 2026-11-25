import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PackWorkspace } from "@/components/pack-workspace";
import { PosterParallax } from "@/components/poster-parallax";
import { SceneSlot } from "@/components/scene-slot";
import { AnchorLink } from "@/components/scroll-provider";
import { StepChapters, type Chapter } from "@/components/step-chapters";
import { getAdapter } from "@/lib/adapter";
import { rgbCss } from "@/lib/color";
import { buildMixTable, encodePlanId, FRAME_H, FRAME_W } from "@/lib/planner";
import { SEED } from "@/lib/seed";

export const metadata: Metadata = {
  title: "Pack your tubes for the coast",
};

const { defaultSceneId: DEFAULT_SCENE_ID, defaultK: DEFAULT_K, studentSet: STUDENT_SET, tubes: TUBES } = SEED;
const CTA_HREF = `/pack?scene=${DEFAULT_SCENE_ID}`;
const tubeOf = (id: string) => TUBES.find((t) => t.id === id);
const ownedTubes = STUDENT_SET.map(tubeOf).filter((t): t is NonNullable<typeof t> => Boolean(t));

/**
 * The three chapter facts, computed at render with the same adapter calls the shared plan page
 * (app/pack/[palette]/page.tsx) makes: getAdapter().getPlan(id) and listScenes(), plus the mix
 * table size the /how page reads. No number here is typed by hand.
 */
function chapterFacts(): Chapter[] {
  const adapter = getAdapter();
  const planId = encodePlanId({ sceneId: DEFAULT_SCENE_ID, k: DEFAULT_K, owned: STUDENT_SET });
  const plan = adapter.getPlan(planId);
  const scene = adapter.listScenes().find((s) => s.id === DEFAULT_SCENE_ID);
  const sceneTitle = scene?.title ?? DEFAULT_SCENE_ID;
  const mixCount = buildMixTable(adapter.mixEngine).length;
  const clusters = plan?.recipes ?? [];
  const picks = (plan?.selected ?? []).map(tubeOf).filter((t): t is NonNullable<typeof t> => Boolean(t));
  const pct = plan ? Math.round(plan.unreachableShare * 100) : 0;

  return [
    {
      id: "picture",
      title: "Show it the picture",
      body: `Tubora shrinks ${sceneTitle} to ${(FRAME_W * FRAME_H).toLocaleString("en-US")} pixels and sorts them into these ${clusters.length} color groups, each weighted by how much canvas it covers.`,
      swatches: clusters.map((r, i) => ({
        key: `c${i}`,
        css: rgbCss(r.clusterRgb),
        label: `${Math.round(r.weight * 100)}% of the picture`,
      })),
    },
    {
      id: "box",
      title: "Tick what's in your box",
      body: `These ${ownedTubes.length} student-set tubes are scored against a table of ${mixCount.toLocaleString("en-US")} one, two and three tube mixes.`,
      swatches: ownedTubes.map((t) => ({ key: t.id, css: rgbCss(t.rgb), label: t.name })),
    },
    {
      id: "count",
      title: "Slide to the tube count",
      body: `At ${plan?.k ?? DEFAULT_K} tubes the planner packs these, and ${pct}% of the sunset is still out of reach.`,
      swatches: picks.map((t) => ({ key: t.id, css: rgbCss(t.rgb), label: t.name })),
    },
  ];
}

export default function Home() {
  const chapters = chapterFacts();

  return (
    <>
      <PosterParallax
        headline="Four tubes in the bag. Know what you can't paint before you leave."
        strip={
          <ul className="flex flex-wrap gap-2" aria-label="The 12-tube student set the example starts from">
            {ownedTubes.map((t, i) => (
              <li
                key={t.id}
                className={`h-12 w-8 rounded-xl border-2 border-border shadow-sticker sm:h-16 sm:w-10 ${i % 2 ? "rotate-2" : "-rotate-2"}`}
                style={{ backgroundColor: rgbCss(t.rgb) }}
                title={t.name}
              >
                <span className="sr-only">{t.name}</span>
              </li>
            ))}
          </ul>
        }
        scene={
          <SceneSlot
            n={1}
            alt="A row of chunky paint tubes on a blush table, four of them pulled forward, with a sunset sketch whose orange sky is circled in red"
            width={1200}
            height={420}
            className="rounded-3xl"
          />
        }
      >
        <p className="tubora-enter-late mt-6 max-w-[65ch] text-lg leading-relaxed sm:text-xl">
          Tick the paints you own and Tubora picks the tubes to carry for one picture, with a recipe for every color and the
          parts they never reach lit up in red.
        </p>
        <div className="tubora-enter-later mt-8 flex flex-wrap items-center gap-4">
          <Button asChild size="lg">
            <Link href={CTA_HREF}>Pack my tubes</Link>
          </Button>
          <AnchorLink href="#live-frame" className="font-bold underline decoration-2 underline-offset-4 hover:text-primary">
            or try it right here
          </AnchorLink>
        </div>
      </PosterParallax>

      <section id="live-frame" className="border-y-2 border-border bg-muted py-16 sm:py-24" aria-labelledby="live-title">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="live-title" className="font-display text-3xl font-semibold sm:text-5xl">
            Dusk over the Sea of Marmara, {STUDENT_SET.length} tubes owned
          </h2>
          <p className="mt-3 max-w-[65ch] text-lg leading-relaxed">
            This is the real planner in your browser: pull the slider from {DEFAULT_K} to {DEFAULT_K - 1} and watch the red
            spread across the sunset.
          </p>
          <div className="mt-8">
            <PackWorkspace
              variant="frame"
              initialSceneId={DEFAULT_SCENE_ID}
              initialK={DEFAULT_K}
              initialOwned={STUDENT_SET}
              mixEngine={getAdapter().mixEngine}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24" aria-labelledby="problem-title">
        <h2 id="problem-title" className="font-display text-3xl font-semibold sm:text-5xl">
          Twelve tubes at home. Room for four on the cliff.
        </h2>
        <p className="mt-4 max-w-[65ch] text-lg leading-relaxed">
          Most painters find out which four tubes were wrong only after the sky has turned to mud on the board.
        </p>
        <details className="mt-4 max-w-[65ch] rounded-2xl border-2 border-border bg-background p-4">
          <summary className="cursor-pointer font-bold">Why not one of the existing mixing apps?</summary>
          <p className="mt-3 text-sm leading-relaxed">
            Color mixing apps answer one question at a time: pick a pixel, get a recipe. Palette simulators go the other
            way and show a palette you already chose. Tubora works on the whole picture: it chooses the subset of tubes
            for you, then shows pixel by pixel what that subset leaves behind.
          </p>
        </details>
        <div className="mt-10 max-w-3xl">
          <SceneSlot
            n={2}
            alt="A painter on a windy pier holding an open paint box with twelve tubes, a canvas showing a sunset gone muddy brown"
            width={960}
            height={720}
            className="-rotate-1 rounded-3xl border-2 border-border shadow-sticker-lg"
          />
        </div>
      </section>

      <StepChapters chapters={chapters} />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24" aria-labelledby="closing-title">
        <h2 id="closing-title" className="font-display text-3xl font-semibold sm:text-5xl">
          See what&apos;s missing before you waste the paint.
        </h2>
        <p className="mt-4 max-w-[65ch] text-lg leading-relaxed">
          Every plan gets its own page and a palette card for the bag, and{" "}
          <Link href="/how" className="font-bold text-primary underline decoration-2 underline-offset-4">
            the method page
          </Link>{" "}
          shows how the tubes are picked.
        </p>
        <div className="mt-10 max-w-3xl">
          <SceneSlot
            n={6}
            alt="A painter walking off the end of a pier at dusk with a small bag holding four paint tubes"
            width={960}
            height={720}
            className="rotate-1 rounded-3xl border-2 border-border shadow-sticker-lg"
          />
        </div>
      </section>
    </>
  );
}
