import type { Metadata } from "next";
import Link from "next/link";
import { PackWorkspace } from "@/components/pack-workspace";
import { RouteEmptyState } from "@/components/route-states";
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
      <div className="tubora-enter mb-8 max-w-3xl">
        <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Which tubes go in the bag?</h1>
        <p className="mt-3 max-w-[65ch] text-base leading-relaxed">
          The sunset is loaded with a 12-tube student set. Drag the slider down from 4 to 3 and watch the red spread: that
          is the part of the picture those tubes cannot mix.
        </p>
      </div>

      <PackWorkspace initialSceneId={sceneId} initialK={k} initialOwned={SEED.studentSet} mixEngine={adapter.mixEngine} />

      <section className="mt-16" aria-labelledby="saved-title">
        <h2 id="saved-title" className="font-display text-2xl font-semibold">Palettes other painters packed</h2>
        {savedPlans.length === 0 ? (
          <SavedPlansEmptyState />
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {savedPlans.map((p, i) => (
              <li key={p.id}>
                <Link
                  href={`/pack/${p.id}`}
                  className={`block h-full rounded-2xl border-2 border-border bg-card p-4 shadow-sticker transition-transform hover:-translate-y-1 ${i % 2 ? "rotate-[0.6deg]" : "-rotate-[0.6deg]"}`}
                >
                  <span className="block font-display text-lg font-semibold leading-tight">{titleOf(p.sceneId)}</span>
                  <span className="mt-1 block text-sm">
                    {p.k} tubes · {p.painter}, {p.city}
                  </span>
                  <span className="mt-2 block text-sm">{p.note}</span>
                  <span className="mt-2 block text-sm font-bold text-primary underline underline-offset-4">Open plan</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
