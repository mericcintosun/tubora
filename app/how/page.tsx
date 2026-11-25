import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SceneSlot } from "@/components/scene-slot";
import { PHRASES } from "@/lib/phrases";
import { buildMixTable, CLUSTERS, FRAME_H, FRAME_W, UNREACHABLE } from "@/lib/planner";
import { TUBES } from "@/lib/data";

export const metadata: Metadata = {
  title: "How it works",
  description: "OKLab clustering, Kubelka-Munk mixing, greedy tube selection, CIEDE2000 heatmaps and the Adaption phrase set.",
};

export default function HowPage() {
  const mixCount = buildMixTable().length;
  const langs = new Set(PHRASES.map((p) => p.lang)).size;

  const stages = [
    {
      title: "Sample and cluster",
      body: `The reference is scaled to ${FRAME_W} by ${FRAME_H} pixels and grouped into ${CLUSTERS} colors with k-means in OKLab, a space where equal steps look equally different. Each group keeps its share of the canvas as a weight, so a big sky matters more than a tiny boat.`,
    },
    {
      title: "Mix every combination",
      body: `All ${TUBES.length} catalog tubes are mixed alone, in pairs and in threes on a six-part grid: ${mixCount.toLocaleString("en-US")} candidate mixes. Mixing uses a single-constant Kubelka-Munk model per channel, which absorbs light the way pigment does instead of averaging it like screen colors.`,
    },
    {
      title: "Pick tubes greedily",
      body: "Starting from an empty bag, Tubora tries each tube you own and keeps the one that lowers the picture's weighted CIEDE2000 error the most, then repeats until the bag holds the number on the slider.",
    },
    {
      title: "Paint the error",
      body: `Every pixel is compared with the best mix its group can reach. Pixels off by more than ${UNREACHABLE} CIEDE2000 units are washed in red. The same pass tries every tube you did not pack and names the one that would help most.`,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="tubora-enter max-w-4xl">
        <h1 className="font-display text-5xl font-semibold leading-tight sm:text-7xl">The method, in four passes</h1>
        <p className="mt-4 max-w-[65ch] text-lg leading-relaxed">
          Everything below runs in your browser or at page render. No account, no key, nothing uploaded.
        </p>
      </div>

      <ol className="mt-12 grid gap-6 md:grid-cols-2">
        {stages.map((s, i) => (
          <li key={s.title}>
            <Card className={i % 2 ? "md:rotate-[0.5deg]" : "md:-rotate-[0.5deg]"}>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {i + 1}. {s.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="max-w-[65ch] leading-relaxed">{s.body}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>

      <section className="mt-20 grid items-center gap-10 md:grid-cols-2" aria-labelledby="phrases-title">
        <SceneSlot
          n={3}
          alt="A speech bubble reading 'evening shadow on snow' turning into a blue-violet paint swatch next to three small tubes"
          width={960}
          height={720}
          className="rotate-1 rounded-3xl border-2 border-border shadow-sticker-lg"
        />
        <div>
          <h2 id="phrases-title" className="font-display text-3xl font-semibold sm:text-4xl">Words to color, with Adaption</h2>
          <p className="mt-4 max-w-[65ch] leading-relaxed">
            Painters describe color in phrases, not hex codes: “evening shadow on snow”, “karın üstünde akşam gölgesi”. The
            phrase box searches a multilingual set of those phrases, each labelled with a target color, hue family, value and
            chroma.
          </p>
          <p className="mt-3 max-w-[65ch] leading-relaxed">
            The full set is generated once with <strong>Adaption Invent</strong> by <code>scripts/adaption_invent.py</code>,
            scored with Adaption&apos;s dataset evaluation, and published as JSONL. Queries are matched in the browser with
            Transformers.js sentence embeddings (paraphrase-multilingual-MiniLM-L12-v2), with a keyword fallback if the model
            cannot load.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary">{PHRASES.length} seed rows today</Badge>
            <Badge variant="outline">{langs} languages</Badge>
            <Badge variant="default">about 600 rows after the Adaption run</Badge>
          </div>
        </div>
      </section>

      <section className="mt-20 max-w-4xl" aria-labelledby="limits-title">
        <h2 id="limits-title" className="font-display text-3xl font-semibold sm:text-4xl">Where it is wrong</h2>
        <ul className="mt-4 max-w-[65ch] list-disc space-y-2 pl-5 leading-relaxed">
          <li>Tube colors are sRGB estimates of masstone swatches, not measured reflectance curves. Brands differ.</li>
          <li>Three-channel Kubelka-Munk misses some hue shifts that a full spectral model catches; spectral.js is next.</li>
          <li>Tinting strength is ignored: one part phthalo is not one part ochre. Treat ratios as a starting point.</li>
          <li>Glazing, broken color and optical mixing are outside the model. It plans the palette, not the painting.</li>
        </ul>
        <Button asChild size="lg" className="mt-8">
          <Link href="/pack?scene=marmara-dusk">Try it on the sunset</Link>
        </Button>
      </section>
    </div>
  );
}
