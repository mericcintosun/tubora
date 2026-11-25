"use client";

import { useRef, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rgbCss } from "@/lib/color";
import { PHRASES, keywordSearch, type PainterPhrase } from "@/lib/phrases";
import { bestMixFor, recipeText } from "@/lib/planner";

const MODEL = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
// Typed as string (not a literal) so TypeScript treats the dynamic import as `any`.
const TRANSFORMERS_URL: string = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";

type Extractor = (
  input: string | string[],
  opts: { pooling: "mean"; normalize: boolean }
) => Promise<{ data: ArrayLike<number>; dims: number[] }>;

// Loaded once per page, reused for every query. Phrase embeddings are computed once too.
let extractorPromise: Promise<Extractor> | null = null;
let phraseVectors: Float32Array[] | null = null;

async function loadExtractor(onProgress: (pct: number) => void): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      // Loaded from the CDN at runtime so the bundle does not depend on the npm package.
      // If it cannot load, run() falls back to keyword search.
      const mod = await import(/* webpackIgnore: true */ TRANSFORMERS_URL);
      const make = mod.pipeline as unknown as (task: string, model: string, opts: object) => Promise<Extractor>;
      return make("feature-extraction", MODEL, {
        progress_callback: (p: { status?: string; progress?: number }) => {
          if (p.status === "progress" && typeof p.progress === "number") onProgress(p.progress);
        },
      });
    })();
    extractorPromise.catch(() => {
      extractorPromise = null;
    });
  }
  return extractorPromise;
}

function rows(out: { data: ArrayLike<number>; dims: number[] }): Float32Array[] {
  const dim = out.dims[out.dims.length - 1];
  const n = out.data.length / dim;
  return Array.from({ length: n }, (_, i) => Float32Array.from(Array.prototype.slice.call(out.data, i * dim, (i + 1) * dim)));
}

interface Hit {
  phrase: PainterPhrase;
  score: number;
  engine: "embedding" | "keyword";
}

/** "Describe a color" box: multilingual sentence embeddings in the browser, keyword fallback. */
export function PhraseSearch({ tubeIdx }: { tubeIdx: number[] }) {
  const [query, setQuery] = useState("karın üstünde akşam gölgesi");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "fallback">("idle");
  const [progress, setProgress] = useState(0);
  const [hit, setHit] = useState<Hit | null>(null);
  const [empty, setEmpty] = useState(false);
  const busy = useRef(false);

  async function run() {
    if (!query.trim() || busy.current) return;
    busy.current = true;
    setEmpty(false);
    try {
      if (status !== "fallback") {
        if (!phraseVectors) setStatus("loading");
        const extract = await loadExtractor((p) => setProgress(Math.round(p)));
        if (!phraseVectors) phraseVectors = rows(await extract(PHRASES.map((p) => p.text), { pooling: "mean", normalize: true }));
        const [q] = rows(await extract(query, { pooling: "mean", normalize: true }));
        let best = 0;
        let bestScore = -1;
        phraseVectors.forEach((v, i) => {
          let dot = 0;
          for (let j = 0; j < v.length; j++) dot += v[j] * q[j];
          if (dot > bestScore) {
            bestScore = dot;
            best = i;
          }
        });
        setStatus("ready");
        setHit({ phrase: PHRASES[best], score: bestScore, engine: "embedding" });
        return;
      }
      throw new Error("fallback");
    } catch {
      setStatus("fallback");
      const k = keywordSearch(query);
      if (k) setHit({ ...k, engine: "keyword" });
      else {
        setHit(null);
        setEmpty(true);
      }
    } finally {
      busy.current = false;
    }
  }

  const recipe = hit && tubeIdx.length > 0 ? bestMixFor(hit.phrase.rgb, tubeIdx) : null;

  return (
    <section className="rounded-2xl border-2 border-border bg-card p-5 shadow-sticker" aria-labelledby="phrase-title">
      <h2 id="phrase-title" className="font-display text-xl font-semibold">
        Describe a color, get a recipe
      </h2>
      <p className="mt-1 max-w-[65ch] text-sm">
        Type it the way you would say it, in English, Turkish or Spanish. Tubora finds the closest painter phrase and mixes
        it from the tubes picked above.
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
      >
        <Input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Color description" placeholder="evening shadow on snow" />
        <Button type="submit" disabled={status === "loading"}>
          <Search />
          Find
        </Button>
      </form>

      {status === "loading" && (
        <div className="mt-4" role="status">
          <p className="text-sm font-bold">Downloading the multilingual model once ({progress}%). The browser caches it.</p>
          <div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-border bg-background">
            <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {empty && <p className="mt-4 text-sm font-bold">No phrase shares a word with that yet. Try “fog”, “snow” or “sunset”.</p>}

      {hit && (
        <div className="tubora-enter mt-4 flex flex-wrap items-center gap-4 rounded-2xl border-2 border-border bg-background p-4">
          <span className="size-14 shrink-0 rounded-full border-2 border-border" style={{ backgroundColor: rgbCss(hit.phrase.rgb) }} />
          <div className="min-w-0 flex-1 space-y-1 text-sm">
            <p className="font-bold">“{hit.phrase.text}”</p>
            <p>
              {hit.phrase.hue}, {hit.phrase.value}, {hit.phrase.chroma}
              {recipe ? (
                <>
                  {" "}· mix <strong>{recipeText(recipe.mix)}</strong> (error {recipe.error.toFixed(1)})
                </>
              ) : (
                " · pick some tubes first"
              )}
            </p>
            <p className="text-xs">
              Matched by {hit.engine === "embedding" ? `in-browser embeddings (${MODEL.split("/")[1]}), similarity ${hit.score.toFixed(2)}` : "keyword overlap, because the model could not load here"}.
            </p>
          </div>
          {hit.phrase.source === "adaption-invent" && hit.phrase.quality !== null ? (
            <Badge variant="ok">Adaption quality {hit.phrase.quality.toFixed(2)}</Badge>
          ) : (
            <Badge variant="outline">seed sample, awaiting Adaption run</Badge>
          )}
        </div>
      )}
    </section>
  );
}
