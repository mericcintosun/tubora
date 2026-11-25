// npm run proof: measures the two mixing engines and rewrites the PROOF blocks in README.md,
// DEMO.md (and SUBMISSION.md if it exists). Never throws, always exits 0, stops within
// PROOF_TIMEOUT_MS. Every block it cannot fill says "Not run in this build: <reason>".
// DEMO.md step 4 is written here from the spectral engine, so no tube name is hard-coded.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const TARGETS = ["README.md", "DEMO.md", "SUBMISSION.md"].map((f) => join(ROOT, f)).filter((f) => existsSync(f));
const FIVE_SECONDS_MS = 5000;
const FALLBACK_TIMEOUT_MS = 90000;

type Blocks = Record<string, string>;
const notRun = (reason: string) => `Not run in this build: ${reason}`;
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e)).split("\n")[0].slice(0, 160);

function rewrite(blocks: Blocks) {
  for (const file of TARGETS) {
    try {
      let text = readFileSync(file, "utf8");
      let changed = false;
      for (const [name, body] of Object.entries(blocks)) {
        const re = new RegExp(`(<!-- PROOF:BEGIN ${name} -->)[\\s\\S]*?(<!-- PROOF:END ${name} -->)`);
        if (!re.test(text)) continue;
        text = text.replace(re, (_m, begin: string, end: string) => `${begin}\n${body.trim()}\n${end}`);
        changed = true;
      }
      if (changed) writeFileSync(file, text);
    } catch (e) {
      console.log(`proof: could not rewrite ${file}: ${msg(e)}`);
    }
  }
}

async function main(timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  const blocks: Blocks = {
    "mix-engine": notRun("the engine measurement did not finish."),
    "wow-numbers": notRun("the planner run did not finish."),
    "demo-step4": notRun("the step 4 planner run did not finish."),
    "demo-path": notRun("the demo path run did not finish."),
    tests: notRun("the test run did not finish."),
    adaption: notRun("the fixture read did not finish."),
  };
  const guard = setTimeout(() => {
    console.log("proof: time budget used up, writing what is ready");
    rewrite(blocks);
    process.exit(0);
  }, timeoutMs);
  guard.unref();

  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
  type Engine = "km-rgb" | "spectral";
  const ENGINES: Engine[] = ["km-rgb", "spectral"];

  // Block 1: blue + yellow in both engines, and the table build time per engine.
  try {
    const color = await import("../lib/color");
    const data = await import("../lib/data");
    const engines = await import("../lib/mix/engines");
    const spectral = await import("../lib/mix/spectral");
    const planner = await import("../lib/planner");
    const blue = data.TUBES.find((t) => t.id === "ultramarine-blue")!;
    const yellow = data.TUBES.find((t) => t.id === "cadmium-yellow-light")!;
    const hue = (rgb: readonly [number, number, number]) => {
      const [, a, b] = color.rgbToOklab(rgb);
      const h = (Math.atan2(b, a) * 180) / Math.PI;
      return h < 0 ? h + 360 : h;
    };
    const rows = ENGINES.map((e) => {
      const t0 = now();
      const n = planner.buildMixTable(e).length;
      const ms = now() - t0;
      const rgb = engines.MIXERS[e]([blue.rgb, yellow.rgb], [1, 1]);
      return `| ${e} | rgb(${rgb.join(", ")}) | ${hue(rgb).toFixed(0)}° | ${n} | ${ms.toFixed(0)} |`;
    });
    const health = spectral.spectralHealth();
    blocks["mix-engine"] = [
      `Ultramarine Blue and Cadmium Yellow Light, 1:1. Hue is the OKLab hue angle (green sits near 140°).`,
      ``,
      `| Engine | Mix | Hue | Mixes in table | Table build (ms) |`,
      `| --- | --- | --- | --- | --- |`,
      ...rows,
      ``,
      health
        ? `Warning: spectral.js did not answer in this run (${health}), so the spectral row shows the km-rgb estimate.`
        : `spectral.js answered every spectral mix in this run.`,
    ].join("\n");
    console.log(`proof: mix-engine ${health ? `spectral fallback (${health})` : "ok"}`);
  } catch (e) {
    blocks["mix-engine"] = notRun(msg(e));
    console.log(`proof: mix-engine not run: ${msg(e)}`);
  }

  // Block 2: the DEMO step 4 numbers, Marmara dusk with the student set at k = 5, 4, 3.
  try {
    const data = await import("../lib/data");
    const planner = await import("../lib/planner");
    const scene = data.sceneById("marmara-dusk");
    if (!scene) throw new Error("scene marmara-dusk is missing");
    const pixels = planner.renderScene(scene);
    const rows: string[] = [];
    for (const e of ENGINES) {
      const a = planner.analyze(pixels, planner.CLUSTERS, e);
      for (const k of [5, 4, 3]) {
        const p = planner.planPalette(a, data.STUDENT_SET, k);
        const s = p.suggestion ? `${data.TUBES[p.suggestion.tube].name}, error drops to ${p.suggestion.avgError.toFixed(1)}` : "none";
        rows.push(`| ${e} | ${k} | ${p.avgError.toFixed(2)} | ${(p.unreachableShare * 100).toFixed(1)}% | ${s} |`);
      }
    }
    blocks["wow-numbers"] = [
      `Dusk over the Sea of Marmara, 12-tube student set.`,
      ``,
      `| Engine | Tubes | Avg error (CIEDE2000) | Out of reach | Suggestion |`,
      `| --- | --- | --- | --- | --- |`,
      ...rows,
    ].join("\n");
    console.log(`proof: wow-numbers ok (${rows.length} rows)`);
  } catch (e) {
    blocks["wow-numbers"] = notRun(msg(e));
    console.log(`proof: wow-numbers not run: ${msg(e)}`);
  }

  // Block 3: DEMO.md step 4, the real engine at the default count and one tube fewer.
  try {
    const data = await import("../lib/data");
    const planner = await import("../lib/planner");
    const { SEED } = await import("../lib/seed");
    const scene = data.sceneById("marmara-dusk");
    if (!scene) throw new Error("scene marmara-dusk is missing");
    const from = SEED.defaultK;
    const to = SEED.defaultK - 1;
    const a = planner.analyze(planner.renderScene(scene), planner.CLUSTERS, "spectral");
    const before = planner.planPalette(a, data.STUDENT_SET, from);
    const after = planner.planPalette(a, data.STUDENT_SET, to);
    const pct = (share: number) => `${(share * 100).toFixed(1)}%`;
    const suggestion = after.suggestion
      ? `The planner suggests ${data.TUBES[after.suggestion.tube].name}: error drops to ${after.suggestion.avgError.toFixed(1)}.`
      : "The planner makes no suggestion at this count.";
    blocks["demo-step4"] = `Slide from ${from} to ${to}: average error ${before.avgError.toFixed(1)} to ${after.avgError.toFixed(1)}, out of reach ${pct(before.unreachableShare)} to ${pct(after.unreachableShare)}. ${suggestion}`;
    console.log(`proof: demo-step4 ok (${after.suggestion ? data.TUBES[after.suggestion.tube].name : "no suggestion"})`);
  } catch (e) {
    blocks["demo-step4"] = notRun(msg(e));
    console.log(`proof: demo-step4 not run: ${msg(e)}`);
  }

  // Block 4: every DEMO step that computes something, timed on the real engine.
  try {
    const data = await import("../lib/data");
    const planner = await import("../lib/planner");
    const phrases = await import("../lib/phrases");
    const adapterMod = await import("../lib/adapter");
    const { SEED } = await import("../lib/seed");
    const scene = data.sceneById("marmara-dusk");
    if (!scene) throw new Error("scene marmara-dusk is missing");
    const pct = (share: number) => `${(share * 100).toFixed(1)}%`;
    const rows: string[] = [];
    const row = (step: string, file: string, engine: string, result: string, ms: number) => {
      const flag = ms > FIVE_SECONDS_MS ? " (over the 5 second rule)" : "";
      rows.push(`| ${step} | \`${file}\` | ${engine} | ${result} | ${ms.toFixed(0)}${flag} |`);
    };

    let t0 = now();
    const a = planner.analyze(planner.renderScene(scene), planner.CLUSTERS, "spectral");
    row("2", "components/pack-workspace.tsx", "spectral", `${a.clusters.length} color groups, ${a.mixes.length} mixes`, now() - t0);

    t0 = now();
    const five = planner.planPalette(a, data.STUDENT_SET, 5);
    row(
      "3",
      "components/pack-workspace.tsx",
      "spectral",
      `${five.selected.length} tubes, average error ${five.avgError.toFixed(1)}, ${pct(five.unreachableShare)} out of reach`,
      now() - t0
    );

    t0 = now();
    const k3 = SEED.defaultK - 1;
    const three = planner.planPalette(a, data.STUDENT_SET, k3);
    const s = three.suggestion
      ? `suggests ${data.TUBES[three.suggestion.tube].name}, error drops to ${three.suggestion.avgError.toFixed(1)}`
      : "no suggestion at this count";
    row("4", "components/pack-workspace.tsx", "spectral", `k=${k3}: average error ${three.avgError.toFixed(1)}, ${pct(three.unreachableShare)} out of reach, ${s}`, now() - t0);

    t0 = now();
    const query = "karın üstünde akşam gölgesi";
    const hit = phrases.keywordSearch(query);
    const mix = hit ? planner.bestMixFor(hit.phrase.rgb, five.selected, "spectral") : null;
    row(
      "5",
      "components/phrase-search.tsx",
      "keyword",
      hit
        ? `"${hit.phrase.text}" (score ${hit.score.toFixed(2)})${mix ? `, mix ${planner.recipeText(mix.mix)}` : ""}`
        : "no keyword hit",
      now() - t0
    );

    t0 = now();
    const shared = adapterMod.buildPlan("marmara-dusk-four-tubes", "spectral");
    row(
      "6",
      "app/pack/[palette]/page.tsx",
      shared ? shared.mixEngine : "spectral",
      shared ? `${shared.selected.length} tubes, ${shared.recipes.length} recipes, average error ${shared.avgError.toFixed(1)}` : "plan did not resolve",
      now() - t0
    );

    const sweep = [2, 3, 4, 5, 6, 7]
      .map((k) => `k=${k} ${pct(planner.planPalette(a, data.STUDENT_SET, k).unreachableShare)}`)
      .join(", ");

    blocks["demo-path"] = [
      `The DEMO.md steps on the spectral engine, Marmara dusk, 12-tube student set. Step 5 uses the keyword matcher because the embedding model runs only in the browser.`,
      ``,
      `| Step | File | Engine | Result | ms |`,
      `| --- | --- | --- | --- | --- |`,
      ...rows,
      ``,
      `Out of reach by tube count (spectral): ${sweep}.`,
    ].join("\n");
    console.log(`proof: demo-path ok (${rows.length} rows)`);
  } catch (e) {
    blocks["demo-path"] = notRun(msg(e));
    console.log(`proof: demo-path not run: ${msg(e)}`);
  }

  // Block 6: the Adaption phrase set, read from the two fixtures only (no network).
  try {
    const rows = JSON.parse(readFileSync(join(ROOT, "fixtures", "phrases.sample.json"), "utf8")) as Array<{ source?: string }>;
    const evaluation = JSON.parse(readFileSync(join(ROOT, "fixtures", "adaption-evaluation.sample.json"), "utf8")) as {
      status?: string;
      quality?: { score_before: number; score_after: number; improvement_percent: number } | null;
      datasetId?: string;
      generatedAt?: string;
    };
    const bySource = new Map<string, number>();
    for (const r of rows) bySource.set(r.source ?? "unknown", (bySource.get(r.source ?? "unknown") ?? 0) + 1);
    const adaptionCount = bySource.get("adaption-invent") ?? 0;
    if (adaptionCount === 0) {
      blocks.adaption = `Not run in this build: no Adaption rows in fixtures/phrases.sample.json, the corpus is ${rows.length} seed rows.`;
    } else {
      const q = evaluation.quality;
      const sources = [...bySource.entries()].map(([s, n]) => `${s} ${n}`).join(", ");
      blocks.adaption = [
        `Rows by source in \`fixtures/phrases.sample.json\`: ${sources}. The phrase box searches the adaption-invent rows.`,
        ``,
        `Evaluation status: ${evaluation.status ?? "unknown"}. ${
          q
            ? `Score ${q.score_before.toFixed(2)} to ${q.score_after.toFixed(2)} (${q.improvement_percent >= 0 ? "+" : ""}${q.improvement_percent.toFixed(1)}%).`
            : "No scores yet."
        }`,
        ``,
        `Dataset id: ${evaluation.datasetId ?? "not recorded"}${evaluation.generatedAt ? `, generated ${evaluation.generatedAt}` : ""}.`,
      ].join("\n");
    }
    console.log(`proof: adaption ${adaptionCount} generated rows`);
  } catch (e) {
    blocks.adaption = notRun(msg(e));
    console.log(`proof: adaption not run: ${msg(e)}`);
  }

  // Block 5: the test file, run as a child process with what is left of the budget.
  try {
    const left = Math.max(1000, deadline - Date.now() - 2000);
    const r = spawnSync("npx", ["tsx", "--test", "tests/mix.test.ts"], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: left,
      shell: process.platform === "win32",
    });
    const out = `${r.stdout ?? ""}\n${r.stderr ?? ""}`;
    const pass = /(?:^|\n)\s*(?:#|ℹ)\s*pass\s+(\d+)/.exec(out);
    const fail = /(?:^|\n)\s*(?:#|ℹ)\s*fail\s+(\d+)/.exec(out);
    if (r.error) {
      blocks.tests = notRun(msg(r.error));
    } else if (pass && fail) {
      blocks.tests = `\`npx tsx --test tests/mix.test.ts\`: ${pass[1]} passed, ${fail[1]} failed.`;
    } else {
      blocks.tests = notRun(`the test runner exited with status ${r.status ?? "none"} and printed no counts.`);
    }
    console.log(`proof: tests ${pass && fail ? `${pass[1]} passed, ${fail[1]} failed` : "not counted"}`);
  } catch (e) {
    blocks.tests = notRun(msg(e));
    console.log(`proof: tests not run: ${msg(e)}`);
  }

  rewrite(blocks);
  clearTimeout(guard);
}

async function run() {
  let timeoutMs = FALLBACK_TIMEOUT_MS;
  try {
    const config = await import("../lib/config");
    timeoutMs = config.PROOF_TIMEOUT_MS;
  } catch {
    // keep the fallback budget
  }
  await main(timeoutMs);
}

run()
  .catch((e) => console.log(`proof: stopped early: ${msg(e)}`))
  .finally(() => process.exit(0));
