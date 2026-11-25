import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PackWorkspace } from "@/components/pack-workspace";
import { SceneSlot } from "@/components/scene-slot";
import { AnchorLink } from "@/components/scroll-provider";
import { SEED } from "@/lib/seed";

export const metadata: Metadata = {
  title: "Pack your tubes for the coast",
};

const { defaultSceneId: DEFAULT_SCENE_ID, studentSet: STUDENT_SET, tubes: TUBES } = SEED;

const STEPS = [
  {
    title: "Show it the picture",
    body: "Tubora shrinks your reference to 6,144 pixels and sorts them into 24 color groups in OKLab, each weighted by how much of the canvas it covers.",
  },
  {
    title: "Tick what's in your box",
    body: `It mixes every 1, 2 and 3 tube combination of the ${TUBES.length}-pigment catalog on a six-part grid with a Kubelka-Munk model, so blue and yellow go muddy the way real paint does.`,
  },
  {
    title: "Slide to the tube count",
    body: "A greedy pass adds whichever tube cuts the picture's weighted CIEDE2000 error the most, until the bag is full. Anything still off by more than 6 turns red.",
  },
];

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:pt-16">
        <h1 className="tubora-enter font-display text-[clamp(3.5rem,9vw,8rem)] font-semibold leading-[0.92] tracking-tight">
          Four tubes in the bag. Know what you can&apos;t paint before you leave.
        </h1>
        <p className="tubora-enter-late mt-6 max-w-[65ch] text-lg leading-relaxed sm:text-xl">
          Drop in a reference photo and tick the paints you own. Tubora picks the best tubes to carry for that picture, gives
          a mixing recipe for every color in it, and lights up the parts those tubes will never reach.
        </p>
        <div className="tubora-enter-later mt-8 flex flex-wrap items-center gap-4">
          <Button asChild size="lg">
            <Link href={`/pack?scene=${DEFAULT_SCENE_ID}`}>Open the sunset example</Link>
          </Button>
          <AnchorLink href="#live-frame" className="font-bold underline decoration-2 underline-offset-4 hover:text-primary">
            or try it right here
          </AnchorLink>
        </div>
        <div className="mt-12">
          <SceneSlot
            n={1}
            alt="A row of chunky paint tubes on a blush table, four of them pulled forward, with a sunset sketch whose orange sky is circled in red"
            width={1200}
            height={420}
            className="rounded-3xl border-2 border-border"
          />
        </div>
      </section>

      <section id="live-frame" className="border-y-2 border-border bg-muted py-14" aria-labelledby="live-title">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="live-title" className="font-display text-3xl font-semibold sm:text-5xl">
            Dusk over the Sea of Marmara, 12 tubes owned
          </h2>
          <p className="mt-3 max-w-[65ch] text-base leading-relaxed">
            This is the real planner running in your browser. Pull the slider to 3 and the orange band of sky goes red. Click
            the suggestion and it comes back.
          </p>
          <div className="mt-8">
            <PackWorkspace variant="frame" initialSceneId={DEFAULT_SCENE_ID} initialK={4} initialOwned={STUDENT_SET} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20" aria-labelledby="problem-title">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 id="problem-title" className="font-display text-3xl font-semibold sm:text-5xl">
              Twelve tubes at home. Room for four on the cliff.
            </h2>
            <p className="mt-4 max-w-[65ch] text-lg leading-relaxed">
              Plein air painters and anyone learning a limited palette face the same packing problem. Most find out which
              four tubes were wrong only after the sky has turned to mud on the board.
            </p>
            <details className="mt-4 max-w-[65ch] rounded-2xl border-2 border-border bg-background p-4">
              <summary className="cursor-pointer font-bold">Why not one of the existing mixing apps?</summary>
              <p className="mt-3 text-sm leading-relaxed">
                Color mixing apps answer one question at a time: pick a pixel, get a recipe. Palette simulators go the other
                way and show a palette you already chose. Tubora works on the whole picture: it chooses the subset of tubes
                for you, then shows pixel by pixel what that subset leaves behind.
              </p>
            </details>
          </div>
          <SceneSlot
            n={2}
            alt="A painter on a windy pier holding an open paint box with twelve tubes, a canvas showing a sunset gone muddy brown"
            width={960}
            height={720}
            className="-rotate-1 rounded-3xl border-2 border-border shadow-sticker-lg"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10" aria-labelledby="steps-title">
        <h2 id="steps-title" className="font-display text-3xl font-semibold sm:text-5xl">What happens when you slide</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className={i === 1 ? "md:translate-y-6" : ""}>
              <span className="inline-flex size-12 items-center justify-center rounded-full border-2 border-border bg-secondary font-display text-xl font-semibold shadow-sticker">
                {i + 1}
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 max-w-[65ch] leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-16 max-w-[65ch] text-lg">
          The full method, the honest limits of sRGB tube swatches, and how the Adaption-generated phrase set plugs in are on{" "}
          <Link href="/how" className="font-bold text-primary underline decoration-2 underline-offset-4">
            the method page
          </Link>
          .
        </p>
      </section>
    </>
  );
}
