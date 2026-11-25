// npm run proof: measures the two mixing engines and rewrites the PROOF blocks in README.md
// (and SUBMISSION.md if it exists). Never throws, always exits 0, stops within PROOF_TIMEOUT_MS.
// Every block it cannot fill says "Not run in this build: <reason>".

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const TARGETS = ["README.md", "SUBMISSION.md"].map((f) => join(ROOT, f)).filter((f) => existsSync(f));
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
    tests: notRun("the test run did not finish."),
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

  // Block 3: the test file, run as a child process with what is left of the budget.
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
