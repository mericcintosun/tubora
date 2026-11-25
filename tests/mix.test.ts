// Mixing engine checks. Run with `npm test` (tsx --test tests/*.test.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { kmMix, rgbToLab, rgbToOklab, type RGB } from "../lib/color";
import { TUBES } from "../lib/data";
import { realAdapter } from "../lib/adapter.real";
import { MIXERS } from "../lib/mix/engines";
import { spectralMix } from "../lib/mix/spectral";
import { buildMixTable } from "../lib/planner";
import { MixQuerySchema } from "../lib/schemas";
import type { MixEngine } from "../lib/types";

const tube = (id: string): RGB => {
  const t = TUBES.find((x) => x.id === id);
  if (!t) throw new Error(`no tube ${id}`);
  return t.rgb;
};

const oklabHue = (rgb: RGB) => {
  const [, a, b] = rgbToOklab(rgb);
  const h = (Math.atan2(b, a) * 180) / Math.PI;
  return h < 0 ? h + 360 : h;
};

const ENGINES: MixEngine[] = ["km-rgb", "spectral"];

test("1. ultramarine and cadmium yellow 1:1 mix to a green under spectral", () => {
  const rgb = spectralMix([tube("ultramarine-blue"), tube("cadmium-yellow-light")], [1, 1]);
  const hue = oklabHue(rgb);
  assert.ok(hue >= 100 && hue <= 200, `expected a green hue between 100 and 200 degrees, got ${hue.toFixed(1)} for rgb(${rgb.join(",")})`);
});

test("2. white plus a tube is lighter than the tube alone, both engines", () => {
  const white = tube("titanium-white");
  for (const engine of ENGINES) {
    for (const id of ["ultramarine-blue", "red-oxide", "ivory-black", "viridian"]) {
      const alone = rgbToLab(tube(id))[0];
      const mixed = rgbToLab(MIXERS[engine]([white, tube(id)], [1, 1]))[0];
      assert.ok(mixed > alone, `${engine}: white + ${id} L*=${mixed.toFixed(1)} should exceed ${alone.toFixed(1)}`);
    }
  }
});

test("3. a single-tube mix returns the tube's own rgb", () => {
  const cad = tube("cadmium-orange");
  assert.deepEqual(spectralMix([cad], [1]), [cad[0], cad[1], cad[2]]);
  for (const engine of ENGINES) {
    const table = buildMixTable(engine);
    TUBES.forEach((t, i) => {
      const single = table.find((m) => m.tubes.length === 1 && m.tubes[0] === i);
      assert.ok(single, `${engine}: no single-tube entry for ${t.id}`);
      assert.deepEqual(single.rgb, [t.rgb[0], t.rgb[1], t.rgb[2]]);
    });
  }
});

test("4. both engines build mix tables of the same length", () => {
  assert.equal(buildMixTable("spectral").length, buildMixTable("km-rgb").length);
});

test("5. realAdapter plans Marmara dusk with the spectral engine and 4 tubes", () => {
  const plan = realAdapter.getPlan("marmara-dusk-four-tubes");
  assert.ok(plan, "plan should resolve");
  assert.equal(plan.mixEngine, "spectral");
  assert.equal(plan.selected.length, 4);
});

test("MixQuerySchema rejects a zero part and an unknown tube", () => {
  assert.equal(MixQuerySchema.safeParse({ tubes: ["titanium-white", "ultramarine-blue"], parts: [0, 1] }).success, false);
  assert.equal(MixQuerySchema.safeParse({ tubes: ["titanium-white", "unicorn-pink"], parts: [1, 1] }).success, false);
  assert.equal(MixQuerySchema.safeParse({ tubes: "titanium-white,ultramarine-blue", parts: "2,1" }).success, true);
});

test("km-rgb stays the per-channel estimate", () => {
  const a = MIXERS["km-rgb"]([tube("ultramarine-blue"), tube("cadmium-yellow-light")], [1, 1]);
  assert.deepEqual(a, kmMix([tube("ultramarine-blue"), tube("cadmium-yellow-light")], [1, 1]));
});
