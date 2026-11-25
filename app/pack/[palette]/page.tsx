import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlanPicture } from "@/components/heatmap-canvas";
import { ShareLink } from "@/components/share-link";
import { rgbCss } from "@/lib/color";
import { TUBES, sceneById } from "@/lib/data";
import { UNREACHABLE, analyze, planPalette, recipeText, renderScene, resolvePlanId } from "@/lib/planner";

type Params = Promise<{ palette: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { palette } = await params;
  const spec = resolvePlanId(palette);
  const scene = spec ? sceneById(spec.sceneId) : null;
  if (!spec || !scene) return { title: "Palette not found" };
  return {
    title: `${spec.k} tubes for ${scene.title}`,
    description: `A ${spec.k}-tube palette plan for "${scene.title}", with mixing recipes and an unreachable-color heatmap.`,
  };
}

export default async function PalettePage({ params }: { params: Params }) {
  const { palette } = await params;
  const spec = resolvePlanId(palette);
  const scene = spec ? sceneById(spec.sceneId) : null;
  if (!spec || !scene) notFound();

  const analysis = analyze(renderScene(scene));
  const plan = planPalette(analysis, spec.owned, spec.k);
  const pct = Math.round(plan.unreachableShare * 100);
  const suggested = plan.suggestion ? TUBES[plan.suggestion.tube] : null;
  const saved = spec.saved;

  return (
    <article className="mx-auto max-w-6xl px-4 py-10">
      <div className="tubora-enter max-w-4xl">
        <p className="text-sm font-bold">
          {saved ? `Packed by ${saved.painter}, ${saved.city} · ${saved.savedAt}` : "Shared from the Tubora workspace"}
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight sm:text-6xl">
          {plan.selected.length} tubes for {scene.title.toLowerCase()}
        </h1>
        <p className="mt-4 max-w-[65ch] text-lg leading-relaxed">
          {pct === 0
            ? `Every part of this picture is within reach. Average error ${plan.avgError.toFixed(1)}.`
            : `${pct}% of the picture is out of reach with this palette (average error ${plan.avgError.toFixed(1)}). ${scene.challenge}`}
        </p>
        {saved && <p className="mt-2 max-w-[65ch] italic">“{saved.note}”</p>}
        <div className="mt-6">
          <ShareLink path={`/pack/${palette}`} />
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="tubora-enter-late">
          <PlanPicture
            sceneId={scene.id}
            owned={spec.owned}
            k={spec.k}
            label={`${scene.title} with the out-of-reach ${pct}% washed in red`}
          />
        </div>
        <div className="tubora-enter-later space-y-6">
          <section aria-labelledby="bag-title">
            <h2 id="bag-title" className="font-display text-2xl font-semibold">In the bag</h2>
            <ol className="mt-3 flex flex-wrap gap-2">
              {plan.selected.map((t, i) => (
                <li
                  key={TUBES[t].id}
                  className={`inline-flex items-center gap-2 rounded-full border-2 border-border bg-card py-1 pl-1 pr-3 font-bold shadow-[0_3px_0_var(--border)] ${i % 2 ? "rotate-1" : "-rotate-1"}`}
                >
                  <span className="size-7 rounded-full border-2 border-border" style={{ backgroundColor: rgbCss(TUBES[t].rgb) }} />
                  {TUBES[t].name}
                  <span className="text-xs font-semibold">{TUBES[t].code}</span>
                </li>
              ))}
            </ol>
            {suggested && plan.suggestion && (
              <p className="mt-4 rounded-2xl border-2 border-border bg-background p-4 text-sm">
                <strong>Missing piece:</strong> adding {suggested.name} would bring the average error down to{" "}
                {plan.suggestion.avgError.toFixed(1)}.
              </p>
            )}
          </section>
          <section aria-labelledby="recipes-title">
            <h2 id="recipes-title" className="font-display text-2xl font-semibold">Recipes, biggest areas first</h2>
            <ul className="mt-3 space-y-2">
              {plan.recipes.slice(0, 10).map((r, i) => (
                <li key={i} className="flex items-center gap-3 rounded-2xl border-2 border-border bg-background px-3 py-2">
                  <span className="flex shrink-0 -space-x-2">
                    <span className="size-8 rounded-full border-2 border-border" style={{ backgroundColor: rgbCss(r.cluster.rgb) }} />
                    <span className="size-8 rounded-full border-2 border-border" style={{ backgroundColor: rgbCss(r.mix.rgb) }} />
                  </span>
                  <span className="flex-1 text-sm">
                    <span className="block font-bold">{recipeText(r.mix)}</span>
                    <span className="text-xs">{Math.round(r.cluster.weight * 100)}% of the picture</span>
                  </span>
                  <Badge variant={r.error > UNREACHABLE ? "destructive" : r.error > 3 ? "secondary" : "ok"}>{r.error.toFixed(1)}</Badge>
                </li>
              ))}
            </ul>
          </section>
          <Button asChild size="lg">
            <Link href={`/pack?scene=${scene.id}&k=${spec.k}`}>Try a different tube count</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
