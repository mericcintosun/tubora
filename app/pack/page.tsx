import type { Metadata } from "next";
import Link from "next/link";
import { PackWorkspace } from "@/components/pack-workspace";
import { DEFAULT_K, DEFAULT_SCENE_ID, SAVED_PLANS, STUDENT_SET, sceneById } from "@/lib/data";

export const metadata: Metadata = {
  title: "Pack your tubes",
  description: "Pick the reference, tick the paints you own, slide the tube count and watch what goes out of reach.",
};

export default async function PackPage({ searchParams }: { searchParams: Promise<{ scene?: string; k?: string }> }) {
  const sp = await searchParams;
  const sceneId = sp.scene && sceneById(sp.scene) ? sp.scene : DEFAULT_SCENE_ID;
  const kNum = Number(sp.k);
  const k = Number.isInteger(kNum) && kNum >= 2 && kNum <= 7 ? kNum : DEFAULT_K;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="tubora-enter mb-8 max-w-3xl">
        <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Which tubes go in the bag?</h1>
        <p className="mt-3 max-w-[65ch] text-base leading-relaxed">
          The sunset is loaded with a 12-tube student set. Drag the slider down from 4 to 3 and watch the sky turn red: that
          is the part of the picture those tubes cannot mix.
        </p>
      </div>

      <PackWorkspace initialSceneId={sceneId} initialK={k} initialOwned={STUDENT_SET} />

      <section className="mt-16" aria-labelledby="saved-title">
        <h2 id="saved-title" className="font-display text-2xl font-semibold">Palettes other painters packed</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SAVED_PLANS.map((p, i) => (
            <li key={p.id}>
              <Link
                href={`/pack/${p.id}`}
                className={`block h-full rounded-2xl border-2 border-border bg-card p-4 shadow-sticker transition-transform hover:-translate-y-1 ${i % 2 ? "rotate-[0.6deg]" : "-rotate-[0.6deg]"}`}
              >
                <span className="block font-display text-lg font-semibold leading-tight">{sceneById(p.sceneId)?.title}</span>
                <span className="mt-1 block text-sm">
                  {p.k} tubes · {p.painter}, {p.city}
                </span>
                <span className="mt-2 block text-sm">{p.note}</span>
                <span className="mt-2 block text-sm font-bold text-primary underline underline-offset-4">Open plan</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
