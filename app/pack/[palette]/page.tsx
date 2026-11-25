import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SceneSlot } from "@/components/scene-slot";
import { PlanPicture } from "@/components/heatmap-canvas";
import { PaletteCard } from "@/components/palette-card";
import { RouteEmptyState } from "@/components/route-states";
import { ShareLink } from "@/components/share-link";
import { getAdapter } from "@/lib/adapter";
import { rgbCss } from "@/lib/color";
import { ENGINE_LINE } from "@/lib/mix/engines";
import { UNREACHABLE } from "@/lib/planner";
import { SEED } from "@/lib/seed";

type Params = Promise<{ palette: string }>;

/** One planner run per request, shared by generateMetadata and the page. */
const loadPlan = cache((palette: string) => {
  const adapter = getAdapter();
  const plan = adapter.getPlan(palette);
  const scene = plan ? adapter.listScenes().find((s) => s.id === plan.sceneId) ?? null : null;
  return plan && scene ? { plan, scene } : null;
});

const tubeOf = (id: string) => SEED.tubes.find((t) => t.id === id);

/** Empty branch of the recipe list: sends the painter back to the workspace with the same scene and count. */
function RecipesEmptyState(props: { title: string; body: string; ctaHref: string; ctaLabel: string }) {
  return <RouteEmptyState {...props} className="mt-3" />;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { palette } = await params;
  const found = loadPlan(palette);
  if (!found) return { title: "Palette not found" };
  const { plan, scene } = found;
  return {
    title: `${plan.k} tubes for ${scene.title}`,
    description: `A ${plan.k}-tube palette plan for "${scene.title}", with mixing recipes and an unreachable-color heatmap.`,
  };
}

export default async function PalettePage({ params }: { params: Params }) {
  const { palette } = await params;
  const found = loadPlan(palette);
  if (!found) notFound();
  const { plan, scene } = found;

  // The engine that really built this plan: a spectral failure falls back to km-rgb in
  // planWithFallback (lib/adapter.real.ts), and the badge follows the plan, not the mode.
  const mixEngine = plan.mixEngine;
  const pct = Math.round(plan.unreachableShare * 100);
  const suggested = plan.suggestion ? tubeOf(plan.suggestion.tubeId) : null;
  const saved = plan.saved;

  return (
    <article className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:pb-24">
      <div className="tubora-enter max-w-5xl">
        <p className="text-sm font-bold">
          {saved ? `Packed by ${saved.painter}, ${saved.city} · ${saved.savedAt}` : "Shared from the Tubora workspace"}
        </p>
        <h1 className="mt-2 break-words font-display text-[clamp(3.5rem,9vw,8rem)] font-semibold leading-[0.92] tracking-tight">
          {plan.selected.length} tubes for {scene.title.toLowerCase()}
        </h1>
        <p className="mt-4 max-w-[65ch] text-lg leading-relaxed">
          {pct === 0
            ? `Every part of this picture is within reach. Average error ${plan.avgError.toFixed(1)}.`
            : `${pct}% of the picture is out of reach with this palette (average error ${plan.avgError.toFixed(1)}). ${scene.challenge}`}
        </p>
        <p className="mt-3">
          <Badge variant={mixEngine === "spectral" ? "ok" : "secondary"} className="whitespace-normal text-left">
            {ENGINE_LINE[mixEngine]}
          </Badge>
        </p>
        {saved && <p className="mt-2 max-w-[65ch] italic">“{saved.note}”</p>}
        <div className="mt-6 flex flex-wrap items-start gap-2">
          <ShareLink path={`/pack/${palette}`} />
          <PaletteCard
            paletteId={palette}
            sceneId={plan.sceneId}
            owned={plan.owned}
            k={plan.k}
            mixEngine={mixEngine}
            selected={plan.selected}
            recipes={plan.recipes}
            avgError={plan.avgError}
            unreachableShare={plan.unreachableShare}
          />
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="tubora-enter-late">
          <PlanPicture
            sceneId={plan.sceneId}
            owned={plan.owned}
            k={plan.k}
            mixEngine={mixEngine}
            label={`${scene.title} with the out-of-reach ${pct}% washed in red`}
          />
        </div>
        <div className="tubora-enter-later space-y-6">
          <section aria-labelledby="bag-title">
            <h2 id="bag-title" className="font-display text-3xl font-semibold sm:text-5xl">In the bag</h2>
            <ol className="mt-3 flex flex-wrap gap-2">
              {plan.selected.map((id, i) => {
                const tube = tubeOf(id);
                if (!tube) return null;
                return (
                  <li
                    key={tube.id}
                    className={`inline-flex items-center gap-2 rounded-full border-2 border-border bg-card py-1 pl-1 pr-3 font-bold shadow-[0_3px_0_var(--border)] ${i % 2 ? "rotate-1" : "-rotate-1"}`}
                  >
                    <span className="size-7 rounded-full border-2 border-border" style={{ backgroundColor: rgbCss(tube.rgb) }} />
                    {tube.name}
                    <span className="text-xs font-semibold">{tube.code}</span>
                  </li>
                );
              })}
            </ol>
            {suggested && plan.suggestion && (
              <Card className="mt-4 bg-background p-4 text-sm">
                <p>
                  <strong>Missing piece:</strong> adding {suggested.name} would bring the average error down to{" "}
                  {plan.suggestion.avgErrorAfter.toFixed(1)}.
                </p>
              </Card>
            )}
          </section>
          <section aria-labelledby="recipes-title">
            <h2 id="recipes-title" className="font-display text-3xl font-semibold sm:text-5xl">Recipes, biggest areas first</h2>
            {plan.recipes.length === 0 ? (
              <RecipesEmptyState
                title="No recipes for this plan yet"
                body="Open it in the workspace and tick a few tubes."
                ctaHref={`/pack?scene=${scene.id}&k=${plan.k}`}
                ctaLabel="Open in the workspace"
              />
            ) : (
              <div className="overflow-x-auto">
                <ul className="mt-3 space-y-2">
                  {plan.recipes.slice(0, 10).map((r, i) => (
                    <li key={i}>
                      <Card className="flex items-center gap-3 bg-background px-3 py-2 shadow-none">
                      <span className="flex shrink-0 -space-x-2">
                        <span className="size-8 rounded-full border-2 border-border" style={{ backgroundColor: rgbCss(r.clusterRgb) }} />
                        <span className="size-8 rounded-full border-2 border-border" style={{ backgroundColor: rgbCss(r.mixRgb) }} />
                      </span>
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="block break-words font-bold" title={r.recipe}>
                          {r.recipe}
                        </span>
                        <span className="text-xs">{Math.round(r.weight * 100)}% of the picture</span>
                      </span>
                      <Badge variant={r.error > UNREACHABLE ? "destructive" : r.error > 3 ? "secondary" : "ok"}>
                        {r.error.toFixed(1)}
                      </Badge>
                      </Card>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
          <Button asChild size="lg">
            <Link href={`/pack?scene=${scene.id}&k=${plan.k}`}>Try a different tube count</Link>
          </Button>
        </div>
      </div>

      <div className="mt-16 sm:mt-24">
        <SceneSlot
          n={5}
          alt="A palette card with four tube swatches and recipe rows, clipped to a wooden field easel by a mustard bulldog clip"
          width={1200}
          height={400}
          className="-rotate-1 rounded-3xl border-2 border-border shadow-sticker-lg"
        />
      </div>
    </article>
  );
}
