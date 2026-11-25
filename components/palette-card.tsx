"use client";

import { useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { heatmapRgba, planHeatmap } from "@/components/heatmap-canvas";
import { SEED } from "@/lib/seed";
import { BAD, DEEP, GROUND, INK, LINE, SURFACE } from "@/lib/tokens";
import type { MixEngine, PlanRecipe, RgbTriple } from "@/lib/types";

// A6 at 300 dpi.
const W = 1240;
const H = 1748;
const M = 80;

type CardState = "idle" | "drawing" | "error";

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const css = (rgb: RgbTriple | readonly [number, number, number]) => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

function fontVar(name: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? `${v}, sans-serif` : "sans-serif";
}

/** Rounded rectangle path (no reliance on ctx.roundRect, which older browsers lack). */
function roundPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Sticker panel: ink shadow 8px down, fill, 4px ink outline (2px at screen scale). */
function sticker(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
  roundPath(ctx, x, y + 8, w, h, r);
  ctx.fillStyle = INK;
  ctx.fill();
  roundPath(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = LINE;
  ctx.stroke();
}

function swatch(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = LINE;
  ctx.stroke();
}

/** Word-wraps `text` into at most `maxLines` lines that fit `width`. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

function fit(ctx: CanvasRenderingContext2D, text: string, width: number): string {
  if (ctx.measureText(text).width <= width) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}...`).width > width) t = t.slice(0, -1);
  return `${t}...`;
}

interface CardProps {
  paletteId: string;
  sceneId: string;
  owned: string[];
  k: number;
  mixEngine: MixEngine;
  /** Tube ids in pick order. */
  selected: string[];
  recipes: PlanRecipe[];
  avgError: number;
  unreachableShare: number;
}

function drawCard(p: CardProps): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  const display = fontVar("--font-fredoka");
  const body = fontVar("--font-nunito");
  const scene = SEED.scenes.find((s) => s.id === p.sceneId);
  const tubes = p.selected.map((id) => SEED.tubes.find((t) => t.id === id)).filter((t): t is NonNullable<typeof t> => t !== undefined);
  const pct = Math.round(p.unreachableShare * 100);

  // Ground and outer sticker.
  ctx.fillStyle = GROUND;
  ctx.fillRect(0, 0, W, H);
  sticker(ctx, 32, 32, W - 64, H - 80, 48, GROUND);

  // Title.
  ctx.fillStyle = INK;
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 76px ${display}`;
  const title = `${tubes.length} tubes for ${(scene?.title ?? p.sceneId).toLowerCase()}`;
  const titleLines = wrap(ctx, title, W - 2 * M, 2);
  titleLines.forEach((l, i) => ctx.fillText(l, M, 160 + i * 84));
  let y = 160 + (titleLines.length - 1) * 84 + 56;

  // Tubes, three columns.
  ctx.font = `600 36px ${display}`;
  ctx.fillText("In the bag", M, y + 20);
  y += 50;
  const colW = (W - 2 * M) / 3;
  tubes.forEach((t, i) => {
    const cx = M + (i % 3) * colW;
    const cy = y + Math.floor(i / 3) * 80;
    swatch(ctx, cx + 28, cy + 32, 26, css(t.rgb));
    ctx.fillStyle = INK;
    ctx.font = `700 26px ${body}`;
    ctx.fillText(fit(ctx, t.name, colW - 80), cx + 66, cy + 30);
    ctx.font = `600 20px ${body}`;
    ctx.fillText(t.code, cx + 66, cy + 56);
  });
  y += Math.ceil(Math.max(tubes.length, 1) / 3) * 80 + 30;

  // Heatmap thumbnail with its caption on the right.
  const thumbW = 600;
  const thumbH = 400;
  const heat = planHeatmap(p.sceneId, p.owned, p.k, p.mixEngine);
  sticker(ctx, M, y, thumbW, thumbH, 28, SURFACE);
  if (heat) {
    const small = document.createElement("canvas");
    small.width = heat.pixels.width;
    small.height = heat.pixels.height;
    const sctx = small.getContext("2d");
    if (!sctx) throw new Error("no 2d context");
    sctx.putImageData(new ImageData(heatmapRgba(heat.pixels, heat.errors, true, hexRgb(BAD)), small.width, small.height), 0, 0);
    ctx.save();
    roundPath(ctx, M + 2, y + 2, thumbW - 4, thumbH - 4, 26);
    ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, M, y, thumbW, thumbH);
    ctx.restore();
    roundPath(ctx, M, y, thumbW, thumbH, 28);
    ctx.lineWidth = 4;
    ctx.strokeStyle = LINE;
    ctx.stroke();
  }
  const capX = M + thumbW + 40;
  const capW = W - M - capX;
  ctx.fillStyle = INK;
  ctx.font = `600 52px ${display}`;
  const capLines = wrap(ctx, `${pct}% out of reach, average error ${p.avgError.toFixed(1)}`, capW, 4);
  capLines.forEach((l, i) => ctx.fillText(l, capX, y + 60 + i * 60));
  ctx.font = `600 24px ${body}`;
  wrap(ctx, "Red on the picture is what these tubes cannot mix.", capW, 3).forEach((l, i) =>
    ctx.fillText(l, capX, y + 60 + capLines.length * 60 + 20 + i * 32)
  );
  y += thumbH + 60;

  // Top 8 recipes.
  ctx.font = `600 36px ${display}`;
  ctx.fillText("Recipes, biggest areas first", M, y + 20);
  y += 44;
  const rowH = 64;
  p.recipes.slice(0, 8).forEach((r, i) => {
    const ry = y + i * rowH;
    roundPath(ctx, M, ry, W - 2 * M, rowH - 8, 24);
    ctx.fillStyle = i % 2 ? GROUND : DEEP;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = LINE;
    ctx.stroke();
    swatch(ctx, M + 38, ry + 28, 18, css(r.clusterRgb));
    swatch(ctx, M + 68, ry + 28, 18, css(r.mixRgb));
    ctx.fillStyle = INK;
    ctx.font = `600 20px ${body}`;
    const meta = `${Math.round(r.weight * 100)}% · error ${r.error.toFixed(1)}`;
    const metaW = ctx.measureText(meta).width;
    ctx.fillText(meta, W - M - 24 - metaW, ry + 35);
    ctx.font = `700 26px ${body}`;
    ctx.fillText(fit(ctx, r.recipe, W - 2 * M - 140 - metaW - 40), M + 104, ry + 37);
  });

  // Footer.
  ctx.fillStyle = INK;
  ctx.font = `700 26px ${body}`;
  ctx.fillText(fit(ctx, `tubora.vercel.app/pack/${p.paletteId}`, W - 2 * M), M, H - 96);
  return canvas;
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** "Download palette card": one A6 PNG for the field bag, drawn in the browser. */
export function PaletteCard(props: CardProps) {
  const [state, setState] = useState<CardState>("idle");
  const empty = props.recipes.length === 0;

  async function download() {
    if (state === "drawing" || empty) return;
    setState("drawing");
    try {
      // Let the "Drawing your card" label paint before the planner run blocks the thread.
      await nextFrame();
      if (document.fonts?.ready) await document.fonts.ready;
      const canvas = drawCard(props);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("toBlob returned nothing");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tubora-${props.paletteId}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={empty || state === "drawing"}
        aria-busy={state === "drawing"}
        onClick={() => void download()}
      >
        <Download />
        {state === "drawing" ? "Drawing your card" : "Download palette card"}
      </Button>
      {empty && <p className="w-full text-sm font-bold">Pack at least one tube to get a card.</p>}
      {state === "error" && (
        <div className="tubora-enter flex w-full flex-wrap items-center gap-2">
          <p role="alert" className="text-sm font-bold text-bad">
            The card could not be drawn in this browser. Copy the link instead.
          </p>
          <Button variant="ghost" size="sm" onClick={() => void download()}>
            <RotateCcw />
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
