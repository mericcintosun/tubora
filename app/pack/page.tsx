import type { Metadata } from "next";
import Link from "next/link";
import { PackWorkspace } from "@/components/pack-workspace";
import { RouteEmptyState } from "@/components/route-states";
import { SceneSlot } from "@/components/scene-slot";
import { Card } from "@/components/ui/card";
import { getAdapter } from "@/lib/adapter";
import { SEED } from "@/lib/seed";

export const metadata: Metadata = {
  title: "Pack your tubes",
  description: "Pick the reference, tick the paints you own, slide the tube count and watch what goes out of reach.",
};

/** Empty branch of the saved palettes list. */
function SavedPlansEmptyState() {
  return (
    <RouteEmptyState
      className="mt-4"
      title="No shared palettes yet"
      body="Pack one above and copy its link. It will open as its own page for anyone you send it to."
      ctaHref="/pack?scene=marmara-dusk&k=4"
      ctaLabel="Pack the sunset with 4 tubes"
    />
  );
}

export default async function PackPage({ searchParams }: { searchParams: Promise<{ scene?: string; k?: string }> }) {
  const sp = await searchParams;
  const adapter = getAdapter();
  const scenes = adapter.listScenes();
  const savedPlans = adapter.listSavedPlans();
  const titleOf = (id: string) => scenes.find((s) => s.id === id)?.title ?? id;

  const sceneId = sp.scene && scenes.some((s) => s.id === sp.scene) ? sp.scene : SEED.defaultSceneId;
  const kNum = Number(sp.k);
  const k = Number.isInteger(kNum) && kNum >= 2 && kNum <= 7 ? kNum : SEED.defaultK;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="tubora-enter mb-8 grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_14rem]">
        <div>
          <h1 className="break-words font-display text-[clamp(3.5rem,9vw,8rem)] font-semibold leading-[0.92] tracking-tight">
            Which tubes go in the bag?
          </h1>
          <p className="mt-4 max-w-[65ch] text-lg leading-relaxed">
            The sunset is loaded with a {SEED.studentSet.length}-tube student set: drag the slider from {SEED.defaultK} to{" "}
            {SEED.defaultK - 1} and the red shows what those tubes cannot mix.
          </p>
        </div>
        <SceneSlot
          n={4}
          alt="An open paint box with twelve tubes in two rows, four of them ticked with a tomato check mark"
          width={800}
          height={800}
          className="hidden max-w-56 rotate-2 rounded-3xl border-2 border-border shadow-sticker md:block"
        />
      </div>

      <PackWorkspace
        initialSceneId={sceneId}
        initialK={k}
        initialOwned={SEED.studentSet}
        mixEngine={adapter.mixEngine}
        evaluation={adapter.getPhraseEvaluation()}
      />

      <section className="mt-16" aria-labelledby="saved-title">
        <h2 id="saved-title" className="font-display text-3xl font-semibold sm:text-5xl">Palettes other painters packed</h2>
        {savedPlans.length === 0 ? (
          <SavedPlansEmptyState />
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {savedPlans.map((p, i) => (
              <li key={p.id}>
                <Card className={i % 2 ? "rotate-[0.6deg] h-full transition-transform hover:-translate-y-1" : "-rotate-[0.6deg] h-full transition-transform hover:-translate-y-1"}>
                  <Link
                    href={`/pack/${p.id}`}
                    className="block h-full rounded-2xl p-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
                  >
                    <span className="block font-display text-lg font-semibold leading-tight">{titleOf(p.sceneId)}</span>
                    <span className="mt-1 block text-sm">
                      {p.k} tubes · {p.painter}, {p.city}
                    </span>
                    <span className="mt-2 block text-sm">{p.note}</span>
                    <span className="mt-2 block text-sm font-bold text-primary underline underline-offset-4">Open plan</span>
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
