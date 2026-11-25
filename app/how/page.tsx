import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RouteEmptyState } from "@/components/route-states";
import { SceneSlot } from "@/components/scene-slot";
import { getAdapter } from "@/lib/adapter";
import { ENGINE_LINE } from "@/lib/mix/engines";
import { buildMixTable, CLUSTERS, FRAME_H, FRAME_W, UNREACHABLE } from "@/lib/planner";
import { SEED } from "@/lib/seed";

export const metadata: Metadata = {
  title: "How it works",
  description: "OKLab clustering, Kubelka-Munk mixing, greedy tube selection, CIEDE2000 heatmaps and the Adaption phrase set.",
};

/** Empty branch of the phrase section: no rows means nothing to search yet. */
function PhrasesEmptyState() {
  return (
    <RouteEmptyState
      className="mt-4"
      title="No painter phrases loaded"
      body="The phrase set is empty in this build. The planner still works: pack the sunset and read the recipes."
      ctaHref="/pack?scene=marmara-dusk"
      ctaLabel="Pack the sunset"
    />
  );
}

export default function HowPage() {
  const adapter = getAdapter();
  const phrases = adapter.listPhrases();
  const tubes = SEED.tubes;
  const mixCount = buildMixTable(adapter.mixEngine).length;
  const langs = new Set(phrases.map((p) => p.lang)).size;
  const evaluation = adapter.getPhraseEvaluation();
  const adaptionRows = phrases.filter((p) => p.source === "adaption-invent").length;
  const seedRows = phrases.length - adaptionRows;
  const q = evaluation.quality;
  const evaluationText =
    adaptionRows === 0
      ? "Adaption run not done in this build: the box searches the seed rows."
      : q
        ? `Adaption evaluation: score ${q.score_before.toFixed(2)} to ${q.score_after.toFixed(2)} (${q.improvement_percent >= 0 ? "+" : ""}${q.improvement_percent.toFixed(1)}%)`
        : "Adaption evaluation pending";
  const engineLine = ENGINE_LINE[adapter.mixEngine];
  const mixBody =
    adapter.mixEngine === "spectral"
      ? "Each tube's color becomes a reflectance curve, the curves are mixed with Kubelka-Munk and the result comes back to screen color, so blue and yellow land on green the way paint does."
      : "Each mix uses a single-constant Kubelka-Munk model per channel, which absorbs light the way pigment does instead of averaging it like screen colors.";

  const stages = [
    {
      title: "Sample and cluster",
      body: `The reference is scaled to ${FRAME_W} by ${FRAME_H} pixels and grouped into ${CLUSTERS} colors with k-means in OKLab, a space where equal steps look equally different. Each group keeps its share of the canvas as a weight, so a big sky matters more than a tiny boat.`,
    },
    {
      title: "Mix every combination",
      body: `All ${tubes.length} catalog tubes are mixed alone, in pairs and in threes on a six-part grid: ${mixCount.toLocaleString("en-US")} candidate mixes. ${engineLine} ${mixBody}`,
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
          {phrases.length === 0 ? (
            <PhrasesEmptyState />
          ) : (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {adaptionRows > 0 && <Badge variant="ok">{adaptionRows} Adaption Invent rows</Badge>}
                {seedRows > 0 && <Badge variant="secondary">{seedRows} seed rows</Badge>}
                <Badge variant="outline">{langs} languages</Badge>
              </div>
              <p className="mt-3 max-w-[65ch] break-words text-sm font-bold">
                {evaluationText}
                {evaluation.datasetId ? ` · dataset ${evaluation.datasetId}` : ""}
              </p>
            </>
          )}
        </div>
      </section>

      <section className="mt-20 max-w-4xl" aria-labelledby="limits-title">
        <h2 id="limits-title" className="font-display text-3xl font-semibold sm:text-4xl">Where it is wrong</h2>
        <ul className="mt-4 max-w-[65ch] list-disc space-y-2 pl-5 leading-relaxed">
          <li>Tube colors are sRGB estimates of masstone swatches, not measured reflectance curves. Brands differ.</li>
          <li>
            {engineLine}{" "}
            {adapter.mixEngine === "spectral"
              ? "Its reflectance curves are rebuilt from the sRGB estimates, so it is only as good as those swatches."
              : "Three-channel Kubelka-Munk misses some hue shifts that the spectral engine catches."}
          </li>
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
