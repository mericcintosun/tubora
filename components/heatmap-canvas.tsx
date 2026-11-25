"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sceneById } from "@/lib/data";
import { UNREACHABLE, analyze, planErrors, planPalette, renderScene, type Pixels } from "@/lib/planner";
import { cn } from "@/lib/utils";

function tokenRgb(name: string): [number, number, number] {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace("#", "");
  const n = parseInt(raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw, 16);
  return Number.isNaN(n) ? [200, 40, 30] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Draws the reference at full color and, when `showHeat` is on, washes every pixel whose
 * CIEDE2000 error is above the unreachable line in the BAD token, stronger the further off.
 */
export function HeatmapCanvas({
  pixels,
  errors,
  showHeat,
  label,
  className,
}: {
  pixels: Pixels;
  errors: Float32Array | null;
  showHeat: boolean;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { width, height, data } = pixels;
    canvas.width = width;
    canvas.height = height;
    const img = ctx.createImageData(width, height);
    const bad = tokenRgb("--bad");
    for (let i = 0; i < width * height; i++) {
      let r = data[i * 3];
      let g = data[i * 3 + 1];
      let b = data[i * 3 + 2];
      if (showHeat && errors) {
        const e = errors[i];
        if (e > UNREACHABLE) {
          const t = Math.min(0.85, 0.45 + (e - UNREACHABLE) / 20);
          r = r + (bad[0] - r) * t;
          g = g + (bad[1] - g) * t;
          b = b + (bad[2] - b) * t;
        } else {
          // reachable pixels fade toward grey so the red reads at a glance
          const y = 0.3 * r + 0.59 * g + 0.11 * b;
          r = r + (y - r) * 0.55;
          g = g + (y - g) * 0.55;
          b = b + (y - b) * 0.55;
        }
      }
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [pixels, errors, showHeat]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={label}
      className={cn("block aspect-[3/2] w-full rounded-2xl border-2 border-border [image-rendering:pixelated]", className)}
    />
  );
}

/** A saved plan's picture: re-renders the scene in the browser and draws its heatmap. */
export function PlanPicture({ sceneId, owned, k, label }: { sceneId: string; owned: string[]; k: number; label: string }) {
  const [showHeat, setShowHeat] = useState(true);
  const scene = sceneById(sceneId);
  const pixels = useMemo(() => (scene ? renderScene(scene) : null), [scene]);
  const errors = useMemo(() => {
    if (!pixels) return null;
    const a = analyze(pixels);
    return planErrors(a, planPalette(a, owned, k));
  }, [pixels, owned, k]);
  if (!pixels) return null;
  return (
    <div className="space-y-3">
      <HeatmapCanvas pixels={pixels} errors={errors} showHeat={showHeat} label={label} className="shadow-sticker-lg" />
      <Button variant={showHeat ? "default" : "outline"} size="sm" onClick={() => setShowHeat((v) => !v)} aria-pressed={showHeat}>
        <Flame />
        {showHeat ? "Heatmap on" : "Heatmap off"}
      </Button>
    </div>
  );
}
