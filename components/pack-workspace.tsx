"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Lightbulb, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { HeatmapCanvas } from "@/components/heatmap-canvas";
import { PhraseSearch } from "@/components/phrase-search";
import { ShareLink } from "@/components/share-link";
import { rgbCss } from "@/lib/color";
import { SCENES, TUBES, sceneById } from "@/lib/data";
import {
  FRAME_H,
  FRAME_W,
  UNREACHABLE,
  analyze,
  encodePlanId,
  fromRgba,
  planErrors,
  planPalette,
  recipeText,
  renderScene,
  type Pixels,
} from "@/lib/planner";
import { ENGINE_LINE } from "@/lib/mix/engines";
import type { MixEngine } from "@/lib/types";
import { cn } from "@/lib/utils";

type Variant = "full" | "frame";

/** Empty branch of the workspace (landing frame and /pack): no tubes ticked, one button to refill. */
function WorkspaceEmptyState({ onRefill }: { onRefill: () => void }) {
  return (
    <Card role="status" className="tubora-enter p-5">
      <p className="font-display text-lg font-semibold">Tick at least one tube you own and Tubora will pack the bag.</p>
      <Button size="sm" className="mt-4" onClick={onRefill}>
        Tick the student set again
      </Button>
    </Card>
  );
}

export function PackWorkspace({
  initialSceneId,
  initialK,
  initialOwned,
  mixEngine,
  variant = "full",
}: {
  initialSceneId: string;
  initialK: number;
  initialOwned: string[];
  /** Chosen on the server by getAdapter(); arrives here as a plain string. */
  mixEngine: MixEngine;
  variant?: Variant;
}) {
  const [sceneId, setSceneId] = useState(initialSceneId);
  const [upload, setUpload] = useState<{ name: string; pixels: Pixels } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [owned, setOwned] = useState<string[]>(initialOwned);
  const [k, setK] = useState(initialK);
  const [showHeat, setShowHeat] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const scene = sceneById(sceneId) ?? SCENES[0];
  const pixels = useMemo(() => upload?.pixels ?? renderScene(scene), [upload, scene]);
  // DEMO steps 2 to 4, real path: the mix table is built with the engine the server chose
  // (spectral under ADAPTER_MODE=real). Same-file fallback: spectralMix in lib/mix/spectral.ts
  // catches a spectral.js failure per mix, logs "[core] spectral fallback engine=km-rgb" once
  // and returns the kmMix estimate for that mix, so the slider never goes blank.
  const analysis = useMemo(() => analyze(pixels, undefined, mixEngine), [pixels, mixEngine]);
  const plan = useMemo(() => planPalette(analysis, owned, k), [analysis, owned, k]);
  const errors = useMemo(() => planErrors(analysis, plan), [analysis, plan]);
  const suggested = plan.suggestion ? TUBES[plan.suggestion.tube] : null;
  const unreachablePct = Math.round(plan.unreachableShare * 100);
  const sceneTitle = upload ? upload.name : scene.title;
  const noTubes = owned.length === 0;

  const toggleTube = (id: string) =>
    setOwned((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = FRAME_W;
      c.height = FRAME_H;
      const ctx = c.getContext("2d");
      if (!ctx) return setUploadError("This browser could not open a canvas to read the photo.");
      const scale = Math.max(FRAME_W / img.width, FRAME_H / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (FRAME_W - w) / 2, (FRAME_H - h) / 2, w, h);
      setUpload({ name: file.name, pixels: fromRgba(ctx.getImageData(0, 0, FRAME_W, FRAME_H).data, FRAME_W, FRAME_H) });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => setUploadError("That file did not decode as an image. Try a JPG or PNG.");
    img.src = url;
  };

  const frame = variant === "frame";

  return (
    <div className={cn("grid gap-6", !frame && "lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]")}>
      {/* picture column */}
      <div className="space-y-4">
        {!frame && (
          <div className="flex flex-wrap gap-2" aria-label="Reference scenes">
            {SCENES.map((s) => (
              <Button
                key={s.id}
                size="sm"
                variant={!upload && s.id === sceneId ? "default" : "outline"}
                aria-pressed={!upload && s.id === sceneId}
                onClick={() => {
                  setUpload(null);
                  setSceneId(s.id);
                }}
              >
                {s.title}
              </Button>
            ))}
          </div>
        )}
        <HeatmapCanvas
          pixels={pixels}
          errors={errors}
          showHeat={showHeat}
          label={`${sceneTitle}, ${showHeat ? `${unreachablePct}% of it out of reach for the chosen tubes, shown in red` : "original colors"}`}
          className="shadow-sticker-lg"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            <span className="font-bold">{sceneTitle}</span>
            {!upload && <span> · {scene.place}</span>}
          </p>
          <Button variant={showHeat ? "default" : "outline"} size="sm" onClick={() => setShowHeat((v) => !v)} aria-pressed={showHeat}>
            <Flame />
            {showHeat ? "Heatmap on" : "Heatmap off"}
          </Button>
        </div>
        {!frame && (
          <div className="space-y-2">
            <label htmlFor="ref-upload" className="flex items-center gap-2 text-sm font-bold">
              <ImagePlus className="size-4" /> Or use your own reference photo
            </label>
            <Input id="ref-upload" type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
            {uploadError && (
              <p role="alert" className="rounded-2xl border-2 border-border bg-background px-4 py-2 text-sm font-bold text-bad">
                {uploadError}
              </p>
            )}
            {upload && (
              <p className="text-xs">Uploads stay in your browser. Share links work for the example scenes only, for now.</p>
            )}
          </div>
        )}
      </div>

      {/* controls column (stacks under the picture in the landing frame) */}
      <div className="space-y-5">
        <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-sticker">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={`k-${variant}`} className="font-display text-xl font-semibold">
              Tubes to carry: {k}
            </label>
            <span className="text-xs" suppressHydrationWarning>
              {mounted ? `picked in ${Math.max(1, Math.round(plan.millis))} ms` : "picked on the server"}
            </span>
          </div>
          <Slider
            id={`k-${variant}`}
            min={2}
            max={7}
            step={1}
            value={k}
            disabled={noTubes}
            aria-disabled={noTubes}
            className={cn("mt-3", noTubes && "cursor-not-allowed opacity-60")}
            onChange={(e) => setK(Number(e.target.value))}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {plan.selected.map((t, i) => (
              <span
                key={TUBES[t].id}
                className={cn(
                  "tubora-enter inline-flex items-center gap-2 rounded-full border-2 border-border bg-background py-1 pl-1 pr-3 text-sm font-bold shadow-[0_3px_0_var(--border)]",
                  i % 2 ? "rotate-1" : "-rotate-1"
                )}
              >
                <span className="size-6 rounded-full border-2 border-border" style={{ backgroundColor: rgbCss(TUBES[t].rgb) }} />
                {TUBES[t].name}
              </span>
            ))}
          </div>
          {!noTubes && (
            <p className="mt-4 max-w-[65ch] text-sm leading-relaxed">
              Average color error is <strong>{plan.avgError.toFixed(1)}</strong> (CIEDE2000; under 2 looks identical, over{" "}
              {UNREACHABLE} looks like a different color). <strong>{unreachablePct}%</strong> of this picture is out of reach
              with these {plan.selected.length} tubes.
            </p>
          )}
          <p className="mt-3">
            <Badge variant={mixEngine === "spectral" ? "ok" : "secondary"} className="whitespace-normal text-left">
              {ENGINE_LINE[mixEngine]}
            </Badge>
          </p>
          {suggested && plan.suggestion && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-3 whitespace-normal text-left"
              onClick={() => {
                if (!owned.includes(suggested.id)) setOwned((cur) => [...cur, suggested.id]);
                setK((v) => Math.min(7, v + 1));
              }}
            >
              <Lightbulb />
              Add {suggested.name}: error drops to {plan.suggestion.avgError.toFixed(1)}
            </Button>
          )}
          {!upload && plan.selected.length > 0 && (
            <div className="mt-4">
              <ShareLink path={`/pack/${encodePlanId({ sceneId, k, owned })}`} openLabel={frame ? undefined : "Open as a page"} />
            </div>
          )}
        </div>

        {noTubes ? (
          <WorkspaceEmptyState onRefill={() => setOwned(initialOwned)} />
        ) : (
        <div className={cn("grid gap-2", frame ? "sm:grid-cols-2 lg:grid-cols-4" : "")}>
          {plan.recipes.slice(0, frame ? 8 : 10).map((r, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border-2 border-border bg-background px-3 py-2">
              <span className="flex shrink-0 -space-x-2">
                <span className="size-8 rounded-full border-2 border-border" style={{ backgroundColor: rgbCss(r.cluster.rgb) }} title="Color in the picture" />
                <span className="size-8 rounded-full border-2 border-border" style={{ backgroundColor: rgbCss(r.mix.rgb) }} title="Estimated mix" />
              </span>
              <span className="min-w-0 flex-1 text-sm">
                <span className="block truncate font-bold">{recipeText(r.mix)}</span>
                <span className="text-xs">{Math.round(r.cluster.weight * 100)}% of the picture</span>
              </span>
              <Badge variant={r.error > UNREACHABLE ? "destructive" : r.error > 3 ? "secondary" : "ok"}>{r.error.toFixed(1)}</Badge>
            </div>
          ))}
        </div>
        )}

        {!frame && (
          <>
            <fieldset className="rounded-2xl border-2 border-border bg-background p-5">
              <legend className="px-2 font-display text-lg font-semibold">Tubes you own ({owned.length})</legend>
              <div className="flex flex-wrap gap-2">
                {TUBES.map((t) => {
                  const on = owned.includes(t.id);
                  return (
                    <Button
                      key={t.id}
                      size="sm"
                      variant={on ? "secondary" : "outline"}
                      aria-pressed={on}
                      onClick={() => toggleTube(t.id)}
                      className={cn(!on && "opacity-70")}
                    >
                      <span className="size-4 rounded-full border-2 border-border" style={{ backgroundColor: rgbCss(t.rgb) }} />
                      {t.short}
                      <span className="text-[10px] font-semibold">{t.code}</span>
                    </Button>
                  );
                })}
              </div>
            </fieldset>
            <PhraseSearch tubeIdx={plan.selected} mixEngine={mixEngine} />
          </>
        )}
      </div>
    </div>
  );
}
