# HANDOFF: Tubora

You are taking over a working Next.js scaffold. Read this file, then `IDENTITY.md`, then start on the Mission list. Keep `npm run build` passing after every change.

## 1. Context

**Product:** Tubora. Drop in a reference photo and tick the paints you own. Tubora picks the best few tubes to carry for that picture, gives a mixing recipe for every color in it, and shows in red the parts those tubes will never reach.

**Plain pitch:** You open the photo you want to paint and tick the tubes you have at home. You choose how many you want to carry, say 4. Tubora picks the 4 that work best for this picture and gives a recipe for each of its colors ("2 parts of this, 1 part of that"). The parts you can't reach with those tubes glow red on the photo, so you see what will be missing before you waste paint. You can also type a phrase like "evening shadow on snow" and get a recipe for that color.

**Hackathon:** InnovArt 2027: Art and Technology Hack Day (Devpost, online, organised by Binnovative). https://innovart2027.devpost.com/

**Deadline:** 2 January 2027, 12:00 EST (17:00 UTC). No extensions.

**Target track:** Grand Prize (the same ranking feeds 2nd, 3rd and Honorable Mention). Also aiming at the Adaption AI Application Award and the Excellence in Creativity Award (automatic). We are not going for the DevSwarm Award: DevSwarm runs only on macOS 14+ and Windows 11, and the builder is on Linux.

**Judging criteria (no weights published):** Impact, Creativity and innovation, Execution, Presentation.

**Verified submission requirements (all three are mandatory, or the project cannot win anything):**
1. Submit the project on Devpost by 2 Jan 2027, 12:00 EST.
2. Register the presentation by the same time through the Google Form shared on the event Discord. It asks for presenter name and contact, country and time zone, project title, a one-paragraph summary and a public project link.
3. The public link (GitHub repo or live app) must show the real output, not a description. If it can't be verified, no presentation slot is scheduled.
4. Present live on Zoom on 3 Jan 2027: 10 minutes total, about 3 of them for questions.

Open questions to ask on Discord before submitting: the eligibility conflict (Devpost box says "students only, 13+", the overview says all ages), and whether the Adaption award needs an opt-in or has its own criteria.

## 2. Current state

Identity: see IDENTITY.md (direction D16, structure S2, archetype L1, kit K3)

### Routes (S2 landing-workspace)

| Route | File | What it shows |
| --- | --- | --- |
| `/` | `app/page.tsx` | L1 poster: full-width display headline, one CTA, scene-1, then the live planner as one full-width frame below the fold, problem section (scene-2), three steps |
| `/pack` | `app/pack/page.tsx` | The workspace: scene picker, photo upload, heatmap, k slider, tube stickers, recipes, inventory toggles, phrase search, saved plans list. `?scene=` and `?k=` preload it |
| `/pack/[palette]` | `app/pack/[palette]/page.tsx` | One shareable plan. `[palette]` is a saved slug (`marmara-dusk-four-tubes`) or an encoded id (`marmara-dusk.k4.<hex owned mask>`). Server-computed recipes, client heatmap, copy-link control |
| `/how` | `app/how/page.tsx` | Method, limits, Adaption phrase set (scene-3) |

Navigation: header has "A shared palette" (`/pack/marmara-dusk-four-tubes`), "How it works" (`/how`) and the CTA "Pack my tubes" (`/pack?scene=marmara-dusk`). The footer links `/pack` and `/how`.

### File map

- `lib/color.ts`: OKLab, CIE Lab, CIEDE2000, per-channel Kubelka-Munk `kmMix`. Real.
- `lib/planner.ts`: `renderScene` (procedural reference scenes), `analyze` (k-means into 24 clusters + cluster-by-mix CIEDE2000 matrix), `buildMixTable` (6,216 mixes), `planPalette` (greedy pick, suggestion, unreachable share), `planErrors` (per-pixel heatmap), `bestMixFor`, `encodePlanId` / `resolvePlanId`. Real.
- `lib/data.ts`: 16 tubes with pigment codes, the 12-tube student set, 5 reference scenes, 8 saved plans by named painters.
- `lib/phrases.ts`: the phrase corpus (18 seed rows in EN/TR/ES) + `keywordSearch` fallback.
- `components/pack-workspace.tsx`: the main client component (also used as the landing's live frame with `variant="frame"`).
- `components/heatmap-canvas.tsx`: canvas renderer + `PlanPicture` for result pages.
- `components/phrase-search.tsx`: Transformers.js embeddings (`Xenova/paraphrase-multilingual-MiniLM-L12-v2`) loaded by dynamic import, determinate download progress, keyword fallback, labels which engine answered.
- `components/share-link.tsx`: copy-link button.
- `components/scroll-provider.tsx`: tube-rack scroll progress bar, native smooth `AnchorLink`.
- `components/site-header.tsx`: sticky solid header with the one brand mark.
- `components/ui/`: button, card, badge, input, slider in the D16 candy treatment (2px ink outlines, `0 4px 0` ink sticker shadow, pill controls, rotated badges).
- `scripts/adaption_invent.py`: Adaption Invent dataset build, keyed and keyless paths in `build_phrase_set`.
- `public/logo.svg`, `app/icon.svg`, `public/illustrations/scene-1..3.svg`, `app/opengraph-image.tsx`: brand pack.

### Real vs mocked

- Real: the full planner (clustering, mixing, greedy selection, heatmap, suggestion), uploads, share URLs, in-browser embedding search.
- Seed sample, not generated yet: the phrase rows in `lib/phrases.ts` (`source: "seed-sample"`, `quality: null`). The UI says so.
- Unverified: the Adaption SDK method names in `scripts/adaption_invent.py` (`datasets.invent(..., estimate=True)`, `datasets.get`, `datasets.get_evaluation`, `datasets.download`). The docs page could not be fetched during scaffolding. Check them against https://docs.adaptionlabs.ai/adaptive-data/invent-a-dataset/ before the first paid run.
- Approximation: tube colors are sRGB estimates; `kmMix` carries `TODO: swap for spectral.js`.

### Interaction kit (K3 scroll)

- Phase 5 state (supersedes the earlier dependency-free note): all three signatures exist, on `lenis` ^1.3.27 and `motion` ^14.14.0. See "Phase 5 handover" at the end of this file.
- Signature 1: `components/scroll-provider.tsx`, `<ReactLenis root>` (skipped under reduced motion) plus the tube-rack bar bound to `useScroll().scrollYProgress`; `AnchorLink` uses `lenis.scrollTo(href, { offset: -80 })`, native fallback otherwise.
- Signature 2: `components/poster-parallax.tsx` on `/`: headline, student-set strip and scene 1 at three rates, Fredoka weight 700 to 500.
- Signature 3: `components/step-chapters.tsx` on `/`: sticky `h-[300vh]` track, three chapters with server-computed Marmara facts.

### One-mark proof (`components/site-header.tsx`)

```tsx
<Link href="/" className="flex items-center gap-2 font-display text-2xl font-semibold">
  <BrandMark size={32} />
  Tubora
</Link>
```

## 3. Mission (in priority order)

1. **Polish the wow moment (3h, do this first).** On `/pack` and the landing frame, with the Marmara sunset and the student set, sliding 4 to 3 must make the orange sky band glow red and show "Add Cadmium Orange: error drops to X". Check the numbers on screen and tune the scene layers in `lib/data.ts`, `UNREACHABLE` and the heatmap wash until that reads in one glance. Done: in a 1280px screen recording, a stranger can say which part of the picture is impossible without being told. Keep selection under 300 ms with 12 owned tubes.
2. **Mixing engine to spectral.js + Web Worker (3h).** Replace `kmMix` with spectral.js reflectance mixing, move `buildMixTable` and `analyze` into a worker (`new Worker(new URL(..., import.meta.url))`), keep `planPalette` on the main thread. Done: a blue + yellow mix reads green, a 4000 px upload doesn't freeze the slider, the README names spectral.js only once it really runs.
3. **Upload and inventory polish (1.5h).** Drag and drop onto the canvas, a "student set / Zorn / everything" preset row, a visible empty state when nothing is ticked. Done: drop a phone photo, get a plan in under 2 seconds.
4. **Adaption phrase set (2.5h).** Verify the SDK calls, run `scripts/adaption_invent.py` with the builder's key, publish the JSONL on Hugging Face Datasets with the "Adaptive Data by Adaption" credit, convert rows into `lib/phrases.ts` with `source: "adaption-invent"` and the evaluation score. Done: typing "karın üstünde akşam gölgesi" returns a generated row, its recipe from the packed tubes, and the green "Adaption quality" badge. If the key or credits never arrive, keep the seed rows and drop the Adaption claim from README and Devpost text.
5. **Printable palette card (1.5h).** One button on `/pack/[palette]` that draws tube list, top 8 recipes and the heatmap thumbnail to a canvas and downloads a PNG. Done: the card prints legibly on A6.
6. **Kit signatures 2 and 3 (1.5h).** See above. Respect reduced motion and keep server HTML readable.
7. **Test and ship (2h).** Three real references (sunset, portrait, snow scene), deploy to Vercel, fill README, record the 90-second video, write the Devpost text, fill the Google Form.
8. **Zoom deck (1h).** Seven minutes: problem, live demo of the slider, method, Adaption set, limits, next steps. Rehearse the slider moment twice.

### 90-second demo script

- 0-15s: "You can't carry 12 tubes to the coast. Which 4?" Marmara sunset on screen.
- 15-30s: the reference loads, the 12 owned tubes are ticked.
- 30-45s: k = 5, the bag fills, every color group gets a recipe and a mix swatch.
- 45-75s: slide to 3, the stickers change, the sky glows red, average error jumps. Click "Add Cadmium Orange" and the red goes out.
- 75-85s: type "karın üstünde akşam gölgesi", get the color and its recipe from the packed tubes, Adaption score in the corner.
- 85-90s: copy the share link (or download the palette card). "See what's missing before you waste the paint."

## 4. Constraints

- Next.js 15 App Router, TypeScript strict, Tailwind v4 (no config file), Vercel. No custom server, no runtime file writes.
- `IDENTITY.md` is law for every color, font, route, layout and animation decision. Colors only through `app/globals.css` tokens; components never carry hex (pigment colors from `lib/data.ts` passed as inline styles are data, not styling). Fredoka on every h1 and h2, Nunito for body. Round radius (0.75rem and up) everywhere. Append to its Amendments section; never edit above it.
- Every control goes through `components/ui/`. Extend there.
- Transformers.js only inside `"use client"` components, via dynamic import. Never call a hosted model with a server key.
- Copy rules: no em or en dashes, no double hyphens as dashes. No "seamless", "leverage", "empower", "robust", "unlock", "elevate", "harness", "cutting-edge", "delve" and friends. Write like a painter talking to a painter.
- Scope: if something threatens 2 Jan, cut it (palette card first, then kit signature 3). Never cut the wow moment or the three submission requirements.
- Run `npm run build` after every change; it must stay green.

## Phase 1 handover: contracts, adapter seam and API stubs

Live URL:

### Goal
Wrap the working planner in five permanent seams (DEMO.md contract, `ADAPTER_MODE` adapter, typed `/api` stubs, one tokens source, error/loading/empty surfaces) without changing any planner math.

### Status
- Slice 1, contracts (`DEMO.md`, `CLAUDE.md`, README paragraph): done.
- Slice 2, typed core, fixtures, seed: done.
- Slice 3, adapter seam: done.
- Slice 4, API stubs and pages through the adapter: done. `app/how/page.tsx` still imports `TUBES` from `@/lib/data` and `PHRASES` from `@/lib/phrases` (outside `app/pack/`, so within the gate, but not yet through the adapter).
- Slice 5, active nav, error and loading surfaces, shared tokens: done.
- Build: not run by the agent. The runner checks `npm run build`.

### Decisions
- `lib/seed.ts` instead of `lib/data/seed.ts`: a `lib/data/` folder would sit beside `lib/data.ts` and make `@/lib/data` ambiguous. `SEED` also carries `tubes` so `app/pack/` never imports `@/lib/data`.
- The client planner is the engine, not a data source. `components/pack-workspace.tsx` and `PlanPicture` still run `analyze` / `planPalette` in the browser for the live slider and heatmap. Server pages and `/api` read through `getAdapter()`.
- `PlanSummary` fields: `id`, `sceneId`, `k`, `owned`, `selected` (tube ids), `recipes` (`clusterRgb`, `mixRgb`, `recipe`, `error`, `weight`), `avgError`, `unreachableShare`, `suggestion` (`tubeId`, `avgErrorAfter`) or null, `saved` (`painter`, `city`, `savedAt`, `note`) or null. Non-finite numbers are written as 0 so the JSON stays valid. Scene title and challenge come from `listScenes()`.
- `/pack/[palette]` wraps the adapter call in React `cache`, so `generateMetadata` and the page share one planner run.
- `ADAPTER_MODE=real` returns the fake adapter with `mode: "real"` until Phase 2.
- `fixtures/phrases.sample.json` and `fixtures/phrases.json` are written in the exact `JSON.stringify(rows, null, 2) + "\n"` layout, so `npm run seed` should be a byte-for-byte no-op (unverified until a human runs it twice).

### Failed attempts
None.

### Files changed
`DEMO.md`, `CLAUDE.md`, `README.md`, `HANDOFF.md`, `IDENTITY.md` (Amendments only), `package.json`, `.env.example`, `lib/types.ts`, `lib/seed.ts`, `lib/adapter.ts`, `lib/tokens.ts`, `lib/phrases.ts`, `fixtures/phrases.sample.json`, `fixtures/phrases.json`, `fixtures/adaption-evaluation.sample.json`, `prompts/adaption-invent.md`, `scripts/seed.mjs`, `app/api/scenes/route.ts`, `app/api/plans/route.ts`, `app/api/plans/[palette]/route.ts`, `app/api/phrases/route.ts`, `app/page.tsx`, `app/layout.tsx`, `app/error.tsx`, `app/not-found.tsx`, `app/opengraph-image.tsx`, `app/pack/page.tsx`, `app/pack/loading.tsx`, `app/pack/[palette]/page.tsx`, `app/pack/[palette]/loading.tsx`, `components/ui/nav-link.tsx`, `components/site-header.tsx`, `components/pack-workspace.tsx`, `.farm-commits.json`.

### Commands run
None, the agent cannot run commands.

### Open questions (for Discord)
- Eligibility conflict: the Devpost box says "students only, 13+", the overview says all ages. Which one holds?
- Adaption AI Application Award: does it need an opt-in, or does it have its own criteria?

### Next best step
Phase 2: spectral.js mixing plus a Web Worker behind `ADAPTER_MODE=real`, and the Adaption Invent rows into `fixtures/phrases.json` (through `fixtures/phrases.sample.json` and `npm run seed`), with `fixtures/adaption-evaluation.sample.json` holding the real score.

## Phase 2 handover: spectral mixing behind the adapter seam

### Goal
Make one mechanism real: spectral.js reflectance mixing (Kubelka-Munk over reflectance curves) builds the mix table for every 2 and 3 tube recipe when `ADAPTER_MODE=real`. `kmMix` stays byte-identical as the permanent fake engine.

### Mechanism that went real
`MIXERS.spectral` (`lib/mix/spectral.ts`, `spectralMix`) builds the mix table under `ADAPTER_MODE=real`, on server pages and in the browser workspace. Still on fixtures in both modes: `listPhrases`, `getPhraseEvaluation` and `listSavedPlans` (plus `listScenes`, which is seed data by design). The phrase rows stay seed samples until Phase 4.

### Status per slice
- Slice 1, config, errors, schemas: done. `lib/config.ts` is the only `ADAPTER_MODE` reader.
- Slice 2, real engine: done, unverified at runtime (see Risks). `realAdapter` in `lib/adapter.real.ts`, selected only by `getAdapter()`.
- Slice 3, client engine and mode line: done. `PackWorkspace`, `PlanPicture` and `PhraseSearch` take `mixEngine` as a plain prop. The badge text lives in `ENGINE_LINE` (`lib/mix/engines.ts`) so the server result page and the client workspace share one string.
- Slice 4, tests and proof: done. `tests/mix.test.ts` has the 5 fixed inputs plus the schema check and a km-rgb identity check. `scripts/proof.ts` fills three README blocks.
- Slice 5, Web Worker: **cut.** The table is about 6,200 mixes and is memoized per engine. Moving it to a worker would make `analyze` async in both client components and needs a cache-priming export in `lib/planner.ts`, which goes past the "engine parameter and per-engine caches only" fence. `WORKER_TIMEOUT_MS` and `WORKER_RETRIES` exist in `lib/config.ts` but nothing uses them yet.
- Build: not run by the agent.

### Decisions
- Engine seam in `lib/planner.ts`: `buildMixTable(engine = "km-rgb")`, `analyze(pixels, k, engine = "km-rgb")` and `bestMixFor(rgb, tubeIdx, engine = "km-rgb")` pick `MIXERS[engine]`. `tableCache` is `Partial<Record<MixEngine, Mix[]>>`. All loops, the greedy pick and the error math are unchanged. Existing callers (`app/how/page.tsx`) compile unchanged and get km-rgb.
- `bestMixFor` got the same optional engine parameter so the phrase box recipe uses the same table as the workspace.
- `.farm-live.json` has empty `requiredEnv` and `optionalEnv`: spectral mixing runs in-process on the server and in the browser and needs no key.
- AI-product items (prompts, response cache) do not apply: the mechanism is deterministic color physics, and the mix table is memoized per engine in `lib/planner.ts`.
- `lib/adapter.ts` and `lib/adapter.real.ts` import each other. That is safe because `realAdapter` only calls into `lib/adapter.ts` inside its methods, never at module load.
- `spectralMix` reads the library defensively: it accepts the v3 `Color` plus multi-color `mix([color, factor], ...)` API, and falls back to folding the older two-color `mix(a, b, t)` with cumulative weights. If spectral.js throws or returns a shape it cannot read, it logs `[core] spectral fallback engine=km-rgb reason=...` once and returns `kmMix` for that mix. `spectralHealth()` reports this, and `npm run proof` prints a warning in the README if it happened. The badge would still say "Live engine" in that case, so check the proof block.
- `types/spectral-js.d.ts` was written because the package was not installed and its typings could not be checked. Since it is an ambient declaration, it wins over any bundled types.
- The CDN model load in `components/phrase-search.tsx` is now bounded: each attempt races `MODEL_LOAD_TIMEOUT_MS` (30 s), with `MODEL_LOAD_RETRIES` (1) retries, then the keyword fallback. On a slow connection the first model download may need more than 30 s. Raise the constant if the human sees the fallback too often. `phrase-search.tsx` imports only these two constants from `lib/config.ts`, not `adapterMode()`.
- Error responses: `{ ok: false, mode, error: ErrorCode, hint }` with codes and HTTP statuses in `lib/errors.ts`.
- Suggestion tube: unknown until `npm run proof` runs. DEMO.md names Cadmium Orange, which came from the km-rgb engine. If the wow-numbers block shows another tube for spectral, update DEMO.md step 4 and the README demo line.

### Risks for the runner
- The spectral.js 3 export names (`Color`, `mix`) and the result format come from memory of its README, not from the installed package. If the build fails on `lib/mix/spectral.ts` or `types/spectral-js.d.ts`, read `node_modules/spectral.js/package.json` and its entry file and match the real names. If it builds but the proof shows the fallback warning, the same check applies.
- `npm test` runs lib files through tsx as CommonJS. If spectral.js is ESM-only and the Node version cannot `require` ESM, test 1 fails or shows the fallback.

### Failed attempts
None.

### Files changed
`lib/config.ts`, `lib/errors.ts`, `lib/schemas.ts`, `lib/types.ts`, `lib/mix/spectral.ts`, `lib/mix/engines.ts`, `types/spectral-js.d.ts`, `lib/planner.ts` (seam only), `lib/adapter.ts`, `lib/adapter.real.ts`, `app/page.tsx`, `app/pack/page.tsx`, `app/pack/[palette]/page.tsx`, `app/api/plans/[palette]/route.ts`, `app/api/mix/route.ts`, `components/pack-workspace.tsx`, `components/heatmap-canvas.tsx`, `components/phrase-search.tsx`, `tests/mix.test.ts`, `scripts/proof.ts`, `README.md`, `.env.example`, `.farm-live.json`, `package.json`, `HANDOFF.md`, `IDENTITY.md` (Amendments only), `.farm-commits.json`.

### Commands run
None, the agent cannot run commands.

### Env keys
None required. `ADAPTER_MODE` is optional (`fake` default, `real` for spectral.js). `ADAPTION_API_KEY` is unchanged and only read by the Python script.

### Open questions
- Eligibility conflict: the Devpost box says "students only, 13+", the overview says all ages. Which one holds?
- Adaption AI Application Award: does it need an opt-in, or does it have its own criteria?
- DEMO step 4 tube name: confirm once `npm run proof` reports the spectral suggestion at k = 3.

### Next best step
Phase 3. If the worker matters for big uploads, add a `primeMixTable(engine, rgb)` export to `lib/planner.ts` (needs approval, it goes past the Phase 2 fence) and build `lib/mix/mix-table.worker.ts` on `WORKER_TIMEOUT_MS` and `WORKER_RETRIES`.

## Phase 3 handover: the demo path on the real engine, end to end

### Goal
All six DEMO.md steps run on the real flow under `ADAPTER_MODE=real` (spectral.js), each with a same-file fallback; every demo route has skeleton, error and empty branches; DEMO.md step 4 is written by `npm run proof` from the real engine with no hard-coded tube name; `npm run demo:reset` returns the demo to its start state.

### Status per slice
- Slice 1, real path plus same-file fallback: done. `planWithFallback` in `lib/adapter.real.ts` (spectral, then km-rgb with one `[core] real fallback getPlan id=... reason=...` line per failure). `/pack/[palette]` reads the badge engine from `plan.mixEngine`. `/how` reads `listPhrases()`, `SEED.tubes` and `mixEngine` through `getAdapter()` / `SEED`, calls `buildMixTable(adapter.mixEngine)` and names the engine from `ENGINE_LINE`. Fallback comment next to the `analyze` useMemo in `components/pack-workspace.tsx`. `components/share-link.tsx` has a `copying` state bound to `disabled` and a `copyFallback` that shows the full URL as selectable text.
- Slice 2, state triad: done. `components/route-states.tsx` (`RouteSkeleton`, `RouteErrorState`, `RouteEmptyState`, no `"use client"`, `tubora-enter`, no pulse, no new keyframe). Route files: `app/loading.tsx` (`HomeSkeleton`), `app/error.tsx` (`RootErrorState`), `app/pack/loading.tsx` (`PackSkeleton`), `app/pack/error.tsx` (`PackErrorState`), `app/pack/[palette]/loading.tsx` (`PaletteSkeleton`), `app/pack/[palette]/error.tsx` (`PaletteErrorState`), `app/how/loading.tsx` (`HowSkeleton`), `app/how/error.tsx` (`HowErrorState`). Empty states: `WorkspaceEmptyState` (pack-workspace, "Tick the student set again" resets to `initialOwned`), `SavedPlansEmptyState` (`app/pack/page.tsx`), `RecipesEmptyState` (`app/pack/[palette]/page.tsx`), `PhrasesEmptyState` (`app/how/page.tsx`), `PhraseEmptyState` (`components/phrase-search.tsx`, same copy plus a "Use sunset" button).
- Slice 3, next/image: done. `SceneSlot` and `BrandMark` render `next/image` with `unoptimized`; `priority` for scene 1 and for the header mark (it sits above the fold on every page). No `<img` left under `app/` or `components/`.
- Slice 4, proof drives step 4: done. `TARGETS` includes `DEMO.md`. New blocks `demo-step4` (DEMO.md) and `demo-path` (README.md, with the k=2 to 7 sweep line). DEMO.md wow line and step 4 no longer name a tube. `/pack` intro now says "watch the red spread".
- Slice 5, persistence, reset, docs: done. `scripts/demo-reset.ts`, `"demo:reset"` in `package.json`, README "Demo reset" section.
- Build, tests, proof, reset: not run by the agent.

### Decisions
- **Store: none** (decision table row 1). Every demo step only reads seeded or computed data. Share links carry the whole plan in the id (`encodePlanId` / `resolvePlanId`), uploads stay in the browser, and the demo performs no server write. `lib/seed.ts` is the single data module; no `lib/store.ts`.
  - Rejected, KV: there is no mutable state on the demo path.
  - Rejected, Postgres: there are no relational reads.
  - Rejected, chain: not a web3 stack.
- **Write-path guards.** There is no server write. The two pending-bound controls are the `ShareLink` button (`disabled={state === "copying"}`) and the phrase "Find" button (`disabled={status === "loading"}`). Server idempotency is not applicable because nothing is written on the server.
- **Step 4 is proof-driven.** The tube name and numbers in DEMO.md step 4 come from `planPalette` on the spectral engine (`SEED.defaultK` to `SEED.defaultK - 1`, Marmara dusk, student set). With no suggestion the line says "no suggestion at this count". The button on screen is the same `planPalette` suggestion, so the two cannot disagree as long as `ADAPTER_MODE=real` is set on the deploy.
- The named empty states for the routes (`SavedPlansEmptyState`, `RecipesEmptyState`, `PhrasesEmptyState`) are thin local wrappers over `RouteEmptyState` in the route file, so each name lives where the table puts it. `WorkspaceEmptyState` and `PhraseEmptyState` are built on `Card` / `Button` directly because their CTA is an in-place button, not a link.
- `demo-reset.ts` writes the phrase fixture first and then imports `lib/data`, `lib/adapter` and `lib/phrases` dynamically, so the checks read the fresh file.

### Failed attempts
None.

### Files changed
`lib/adapter.real.ts`, `app/how/page.tsx`, `app/how/loading.tsx` (new), `app/how/error.tsx` (new), `app/loading.tsx` (new), `app/error.tsx`, `app/pack/page.tsx`, `app/pack/loading.tsx`, `app/pack/error.tsx` (new), `app/pack/[palette]/page.tsx`, `app/pack/[palette]/loading.tsx`, `app/pack/[palette]/error.tsx` (new), `components/route-states.tsx` (new), `components/pack-workspace.tsx`, `components/share-link.tsx`, `components/phrase-search.tsx`, `components/scene-slot.tsx`, `components/brand-mark.tsx`, `scripts/proof.ts`, `scripts/demo-reset.ts` (new), `package.json`, `DEMO.md`, `README.md`, `HANDOFF.md`, `IDENTITY.md` (Amendments only), `.farm-commits.json`.

### Commands run
None, the agent cannot run commands.

### Open questions
- **Wow story under spectral at k=3.** The Phase 2 proof shows 87.6% of the sunset out of reach at k=3 (43.8% at k=4). That may read as "the whole picture goes red" rather than "the sky band goes red". Not tuned here (`lib/data.ts` is out of scope); for the wow-polish pass, check the `demo-path` sweep line and decide whether the scene layers, `UNREACHABLE` or the heatmap wash need work.
- `app/page.tsx` still says "Pull the slider to 3 and the orange band of sky goes red". No tube name, but it may overstate what spectral shows at k=3. The `/` composition was frozen this phase, so the copy was left for the wow-polish pass.
- Eligibility conflict: the Devpost box says "students only, 13+", the overview says all ages. Which one holds? (Discord)
- Adaption AI Application Award: does it need an opt-in, or does it have its own criteria? (Discord)
- Worker: if `demo-path` marks step 2 "over the 5 second rule", a Web Worker needs approval plus a `primeMixTable` export in `lib/planner.ts` (Phase 4 item).

### Next best step
Phase 4: the Adaption phrase run (verify the SDK calls, generate rows into `fixtures/phrases.sample.json`, `npm run seed`, real evaluation score) and the wow tuning from the `demo-step4` / `demo-path` numbers.

## Phase 4 handover: Adaption wiring, palette card, mobile pass, security docs

### Goal
Wire DEMO step 5 end to end to Adaption (script writes the fixtures, the corpus prefers Adaption rows, the evaluation shows on screen), add the palette card as DEMO step 7, make 360/768/1280 px work, finish metadata and landing copy, and document a wallet-free codebase (Part B).

### Status per slice
- A1, Adaption integration: done, unverified at runtime. `scripts/adaption_invent.py` now uses `Adaption()`, `datasets.invent(dataset_prompt=..., training_type="instruction_dataset", estimate=True)`, the real `invent`, `wait_for_completion(dataset_id, timeout=3600)` with a `datasets.get` polling fallback, `get_evaluation`, `download(format="jsonl")` with a `get_export_links` fallback. It validates rows (lang, hex, hue, value, chroma), drops and counts the bad ones, and writes `fixtures/phrases.sample.json` (Adaption rows `a0001`... plus the 18 seed rows, sorted by id, 2-space JSON plus newline), `fixtures/adaption-evaluation.sample.json` (`status, quality, datasetId, rows, generatedAt`) and `data/painter-phrases.jsonl`. Without a key it touches nothing. `activePhrases()` in `lib/phrases.ts` is used by `PHRASES`, `keywordSearch` and `fakeAdapter.listPhrases()` (the real adapter delegates). `AdaptionEvaluation` gained optional `datasetId`, `rows`, `generatedAt`. The evaluation flows `app/pack/page.tsx` to `PackWorkspace` to `PhraseSearch` (`evaluation` prop) and is shown on `/how`. README `adaption` proof block, `tests/phrases.test.ts`, dataset card `datasets/tubora-painter-phrases/README.md`.
- A2, bounty table and `DELIVERY.md`: done.
- A3, palette card: done, unverified in a browser. `components/palette-card.tsx`, mounted next to `<ShareLink>` on `/pack/[palette]`. DEMO step 7 added.
- A4, responsive: done by reading. `components/mobile-nav.tsx`, `sm` buttons `h-11 px-4 text-sm`, slider `h-11` with drawn track and thumb, card grids `grid-cols-1` below md, recipe text `truncate`/`break-words` with `title`.
- A5, metadata and landing copy: done.
- B1, web hygiene: clean; the only changes were the footer section and the jsDelivr/Hugging Face line in the phrase box.
- B2, `SECURITY.md`: done.
- Build, tests, proof: not run by the agent.

### Depth statement (Adaption)
Deleting `scripts/adaption_invent.py` leaves nothing that can produce the `adaption-invent` rows and the evaluation. Deleting those rows from `fixtures/phrases.sample.json` turns the DEMO step 5 output back to the seed badge and removes the evaluation line on `/pack` and `/how`. Today the fixture holds only seed rows, so step 5 shows the seed badge.

Seat check: one model provider (Transformers.js in the browser, `components/phrase-search.tsx`); Adaption is the data seat. No second occupant.

### Decisions
- **Palette card import fence.** The spec's step 2 says "reuse a helper from `components/heatmap-canvas.tsx`; export one there if needed", and the gate says the card imports only `lib/*` and `components/ui/*`. These conflict. I followed step 2: `heatmap-canvas.tsx` now exports `heatmapRgba` (the red wash, also used by `HeatmapCanvas` itself) and `planHeatmap` (renderScene, analyze with CLUSTERS, planPalette, planErrors). The card imports those two, so no wash logic is copied. The card does not import `lib/planner` directly. Gate item marked unmet in the summary for that reason.
- The card's red comes from `BAD` in `lib/tokens.ts` (passed into `heatmapRgba`), not the CSS variable, per "colors only from lib/tokens.ts". Fonts come from `--font-fredoka` / `--font-nunito` via `getComputedStyle`, after `document.fonts.ready`.
- Below `sm` the header CTA button hides and "Pack my tubes" lives in the mobile menu, so brand, CTA and menu button never crowd 360 px. From `sm` to `md` the CTA and the menu button show; from `md` up the two desktop links show.
- The mobile panel is `hidden` when closed (not unmounted), positioned against the sticky header, solid `bg-background`, no blur.
- `/how` row count is by source of the active corpus (Adaption rows or seed rows, never both), because the adapter serves only the active set.
- `.env.example` and `.farm-live.json` unchanged: the Vercel app never reads `ADAPTION_API_KEY`.
- Bounty table placed under "How it uses the sponsor tech", before the Adaption paragraph.

### Part B notes
- Contract front skipped: no `contracts/` directory, not a web3 stack.
- Wallet front verified vacuously. Greps over `app/ components/ lib/ scripts/` for `eth_requestAccounts`, `connect(`, `eth_sign`, `personal_sign`: no match for any. No Blockaid warning is expected because the site requests no wallet access.
- Secrets grep (`sk-`, `pt_live_`, `PRIVATE_KEY`, 64-hex, base64 runs over 40 chars) over `app/ components/ lib/`: the only hits are the `dusk-` substring in the `marmara-dusk-four-tubes` slug (false positive). No keys.
- `http://` in app code: only the SVG `xmlns="http://www.w3.org/2000/svg"` namespace in `app/icon.svg` (never-touch, not a fetch).
- `target="_blank"`: one, the footer source link, with `rel="noopener noreferrer"`.
- `/api/*`: all five routes export only `GET`. `/api/mix` and `/api/plans/[palette]` validate with zod schemas from `lib/schemas.ts`; the other three take no input.
- `process.env` reads: `ADAPTER_MODE` (`lib/config.ts`), `NEXT_PUBLIC_BRAND_FILES` (`lib/brand-files.ts`, `next.config.ts`), and `ADAPTION_API_KEY` (Python `os.environ`, script only). All three are in `.env.example`.

### Failed attempts
None.

### Files changed
`scripts/adaption_invent.py`, `lib/phrases.ts`, `lib/adapter.ts`, `lib/adapter.real.ts`, `lib/types.ts`, `components/phrase-search.tsx`, `components/pack-workspace.tsx`, `app/pack/page.tsx`, `app/how/page.tsx`, `scripts/proof.ts`, `tests/phrases.test.ts` (new), `datasets/tubora-painter-phrases/README.md` (new), `README.md`, `DELIVERY.md` (new), `components/palette-card.tsx` (new), `components/heatmap-canvas.tsx`, `app/pack/[palette]/page.tsx`, `DEMO.md`, `components/mobile-nav.tsx` (new), `components/site-header.tsx`, `components/ui/button.tsx`, `components/ui/slider.tsx`, `app/layout.tsx`, `app/page.tsx`, `SECURITY.md` (new), `HANDOFF.md`, `IDENTITY.md` (Amendments only), `.farm-commits.json`.

### Commands run
None, the agent cannot run commands.

### Risks for the runner
- `heatmapRgba` returns a `Uint8ClampedArray` passed to `new ImageData(...)`. With TypeScript 5.7+ DOM typings this needs a `Uint8ClampedArray<ArrayBuffer>`, which `new Uint8ClampedArray(n)` infers. If the build reports a type mismatch there, annotate the return type as `Uint8ClampedArray<ArrayBuffer>`.
- The slider thumb offset (`-mt-1.5` on the webkit thumb) is set by arithmetic, not by eye. Check it at 360 px.
- `npm run proof` now also writes the README `adaption` block; it reads the two fixtures only.

### Open questions
- Discord: does the Adaption AI Application Award need an opt-in, or does it have its own criteria? (`DELIVERY.md` `action:` line waits on this.)
- Discord: eligibility conflict (Devpost "students only, 13+" vs overview "all ages").
- Ask first: the Web Worker plus a `primeMixTable` export in `lib/planner.ts`. Still not approved, still not built.
- Adaption SDK: every kwarg and response field not checked against the docs carries `# UNVERIFIED` in the script (the estimate fields `estimated_credits` / `available_credits`, the job id field, `download` return shape, `get_export_links` shape, the instruction wrapper fields).

### Manual checklist (builder)
1. Read the three Adaption docs pages and fix any `# UNVERIFIED` line in `scripts/adaption_invent.py`.
2. `pip install adaption`, then `ADAPTION_API_KEY=... python scripts/adaption_invent.py`, then `npm run seed` and `npm run proof`.
3. Publish `data/painter-phrases.jsonl` with `datasets/tubora-painter-phrases/README.md` on Hugging Face.
4. If no key or credits arrive: keep the seed rows, remove the Adaption row from the README bounty table and the Adaption claim from the Devpost text.
5. Ask the two Discord questions above.
6. Walk DEMO steps 1 to 7 in a private window; open the step 7 PNG and check it reads at A6.

### Next best step
Phase 5: kit signatures 2 (parallax on `/`) and 3 (sticky horizontal chapters) with `lenis` ^1.3.27 and `motion` ^14.14.0, respecting reduced motion and keeping `components/scroll-provider.tsx` signature 1 working.

## 5. Definition of done

- Deployed on Vercel at https://tubora.vercel.app, README demo link live, repo public.
- The 90-second flow above works end to end on seed data, with no console errors.
- The 4 to 3 slider moment rehearsed and recorded.
- Devpost submitted, Google Form filled, Zoom slot confirmed for 3 Jan 2027.

## Phase 5 handover: poster in motion, scroll chapters and the submission package

### Goal
DEMO steps 1 to 7 run unchanged in function. The poster on `/` now responds to scroll (headline weight 700 to 500 plus parallax), the rack bar fills under Lenis, a sticky section walks three chapters sideways with real Marmara numbers, and one CTA "Pack my tubes" (`/pack?scene=marmara-dusk`, header and hero) lands the judge on step 2. README, LICENSE, `docs/SCREENSHOTS.md` and `SUBMISSION.md` make up the submission package.

### Status per slice
- A1, poster shell and single CTA: done. Hero CTA is `<Link href={CTA_HREF}>Pack my tubes</Link>` with `CTA_HREF = /pack?scene=${SEED.defaultSceneId}` (= `/pack?scene=marmara-dusk`, the header's href). "or try it right here" stays an underlined `AnchorLink`. The fold is `min-h-[calc(100svh-4rem)]` holding only h1, a one-sentence lede and the CTA row; the strip and scene 1 sit below it. DEMO step 1 text updated (header or hero, same label).
- A2, primitives: done for every bare control and the bespoke panels named in `.farm-delta.md`. `components/mobile-nav.tsx` menu button is now `Button variant="outline" size="icon"`. Saved plans (`app/pack/page.tsx`), "Missing piece" and recipe rows (`app/pack/[palette]/page.tsx`), the workspace control panel and recipe rows (`components/pack-workspace.tsx`) use `Card`. h1 on all four routes uses `text-[clamp(3.5rem,9vw,8rem)]`; h2 on the four routes is `text-3xl sm:text-5xl`. Not converted: the workspace `fieldset`, the upload error `<p>`, the phrase search panels and the share-link fallback box, which keep hand-written candy classes (all `rounded-2xl border-2 border-border`).
- A3, simplification: done. Home section bodies are one sentence each; the "Why not one of the existing mixing apps?" `<details>` is untouched. `/how` method passes and the limits list fold behind one-line `<details>`; the phrase section keeps one sentence plus scene 3, with the long text in a `<details>`. The footer is one sentence plus Workspace, Method, Source on GitHub (`rel="noopener noreferrer"`) and InnovArt 2027.
- B1, Lenis root and progress bar: done. `package.json` gains `"lenis": "^1.3.27"` and `"motion": "^14.14.0"`. No `requestAnimationFrame` left in `components/scroll-provider.tsx`.
- B2, parallax and chapters: done. `components/poster-parallax.tsx` and `components/step-chapters.tsx`, both `"use client"`, both import `motion/react` and call `useTransform`.
- B3, scene slots 4 to 6: done, as hand-drawn SVG fallbacks.
- C1, README truth pass, LICENSE, screenshot list: done. `scripts/proof.ts` unchanged (no new number added; its `TARGETS` already includes `SUBMISSION.md`).
- C2, SUBMISSION.md and hygiene: done. `.gitignore` already covers `.env*` with `!.env.example`; `.env.example` unchanged.
- Build, tests, proof: not run by the agent.

### Decisions
- **CTA unification.** One label, one href, two places: the header button (`components/site-header.tsx`, unchanged, hidden below `sm` where the mobile menu carries it) and the hero button (`app/page.tsx`). "Open the sunset example" is gone from the repo.
- **Slot to route pairs.** 1 `/` poster (parallax layer below the fold), 2 `/` problem section, 3 `/how` phrase section, 4 `/pack` beside the intro (from `md` up), 5 `/pack/[palette]` below the plan, 6 `/` closing section. There is no `public/brand/`, so all six render the SVG fallbacks in `public/illustrations/scene-{1..6}.svg`; 4, 5 and 6 are new this phase, drawn in IDENTITY hexes only.
- **Seed source for the chapter numbers.** `chapterFacts()` in `app/page.tsx` runs on the server: `getAdapter().getPlan(encodePlanId({ sceneId: SEED.defaultSceneId, k: SEED.defaultK, owned: SEED.studentSet }))` and `listScenes()` (the same calls `app/pack/[palette]/page.tsx` makes), plus `buildMixTable(adapter.mixEngine).length` (the same call `/how` makes). Chapter 1 shows the plan's cluster colors (`recipes[].clusterRgb`, 24 on this scene), chapter 2 the 12 `SEED.studentSet` tubes and the mix table size, chapter 3 the k picks and `unreachableShare`. The strip in the poster is `SEED.studentSet` mapped to `SEED.tubes`. No planner number is typed by hand.
- **Lenis as a childless sibling.** `ScrollProvider` renders `<ReactLenis root />` next to the tree, not around it, and only once `useReducedMotion()` reports `false`. Wrapping the tree would remount the whole page when Lenis turns on after hydration. `useLenis()` in `AnchorLink` reads the root instance.
- **No off-screen server HTML.** `StepChapters` renders a vertical list of sections on the server and under reduced motion; it switches to the sticky sideways track only after hydration with motion allowed. `PosterParallax` server-renders its resting state (y 0, weight 700) and binds no motion value under reduced motion.
- **Entrance vs parallax.** `tubora-enter` moved from the h1 to a wrapper div, because the keyframe's `both` fill mode would override Motion's inline `transform` on the h1.
- **CLAUDE.md "never touch".** CLAUDE.md lists `components/scroll-provider.tsx` and `public/illustrations/*` as never-touch. This phase's spec explicitly assigns the scroll-provider rewrite and the scene-4 to scene-6 files, so I followed the phase spec. scene-1 to scene-3 are unchanged. CLAUDE.md itself was not edited; a later phase may want to update that line.
- The progress bar is now `aria-hidden` (it was a `role="progressbar"` without a value). It is decoration that mirrors the scrollbar.

### Failed attempts
None.

### Files changed
`package.json`, `components/scroll-provider.tsx`, `components/poster-parallax.tsx` (new), `components/step-chapters.tsx` (new), `components/mobile-nav.tsx`, `components/pack-workspace.tsx`, `app/page.tsx`, `app/layout.tsx`, `app/pack/page.tsx`, `app/pack/[palette]/page.tsx`, `app/how/page.tsx`, `public/illustrations/scene-4.svg` (new), `public/illustrations/scene-5.svg` (new), `public/illustrations/scene-6.svg` (new), `README.md`, `LICENSE` (new), `docs/SCREENSHOTS.md` (new), `SUBMISSION.md` (new), `DEMO.md` (step 1 wording), `IDENTITY.md` (Amendments only), `HANDOFF.md`.

### Commands run
None, because the agent cannot run commands.

### Risks for the runner
- **`motion` ^14.14.0 may not be published.** The range is the one IDENTITY.md mandates, but the agent could not check the npm registry. If `npm install` reports no matching version, that is an IDENTITY-level decision (the range is in the key block's kit section); record it here rather than silently picking another major.
- `<ReactLenis root options={{ lerp: 0.12 }} />` is used without children. If the installed `lenis/react` types make `children` required, pass `{null}` as children.
- `ImageData` in `components/heatmap-canvas.tsx`: annotate the return as `Uint8ClampedArray<ArrayBuffer>` if TypeScript complains (Phase 4 note).
- `app/page.tsx` now builds a plan and the mix table at render (static prerender at build). On `ADAPTER_MODE=real` that is the spectral table, about the cost of one `/pack/[palette]` render.

### Open questions
- Discord: does the Adaption AI Application Award need an opt-in, or does it have its own criteria? (`DELIVERY.md` and `SUBMISSION.md` carry the same `action:` line until it is answered.)
- Discord: eligibility conflict (Devpost "students only, 13+" vs overview "all ages").
- Ask first: the Web Worker plus a `primeMixTable` export in `lib/planner.ts`. Still not approved, still not built.
- `/pack` h1 at the full display clamp pushes the workspace about one headline lower than before; check at 1280 that the sunset is still visible on load (DEMO step 2), and shrink only with an IDENTITY amendment if not.

### Next best step
Phase 6: apply the judge panel round 1.

### Manual submit checklist (builder)
1. Presenter name and contact, country and time zone for the Google Form (the link is on Discord); the rest of the form is in `SUBMISSION.md`.
2. Submit on Devpost before 2 Jan 2027 12:00 EST, using the fields in `SUBMISSION.md`.
3. Confirm the Zoom slot on 3 Jan 2027 (10 minutes, about 3 of them questions).
4. Paste your own video link into the form yourself; the repo carries none.
5. Run Adaption (`python scripts/adaption_invent.py` with your key, then `npm run seed` and `npm run proof`) and publish the dataset on Hugging Face. If no credits arrive, remove the Adaption claim from `README.md`, `SUBMISSION.md` and the Devpost text.

## QA round 1: "out of reach" share on the shared plan pages

Finding: `/pack/marmara-dusk-four-tubes`, `/pack/marmara-dusk.k4.eb77` and `/pack/marmara-dusk-three-tubes` led with "44% / 88% of the picture is out of reach with this palette", which a judge reads as a failure banner.

Root cause: `pixelErrors` in `lib/planner.ts` compared every raw pixel with its group's mix. That error also counted the synthetic grain (plus or minus 5 per channel in `renderScene`) and the color spread inside each of the 24 groups. No palette can close either of those: even a perfect mix of the group color left those pixels red. So the share and the red wash were inflated and disagreed with the recipe badges and the average error printed next to them (average 5.2, yet 44% "over 6").

Fix: each pixel now takes its group's error against the best mix (`a.deltas`), so the red share, the heatmap and the recipe badges all measure the same thing. The result page sentence now leads with what the tubes do reach and gives the scene's hard part as a planning note. `/how` and README step 4 describe the new rule. The proof blocks in README.md, DEMO.md and SUBMISSION.md regenerate on the next `npm run proof`. The 43.8% / 87.6% figures in the Phase 3 open question above come from the old metric.

Re-check of the same crawl (screenshots `qa-4.png`, `qa-5.png`): the live pages still show the old sentence ("44% of the picture is out of reach with this palette"), which no longer exists anywhere in the repo. So the crawl ran on a deploy built before `63608ec`; the fix needs a redeploy, not more code. With the group-based metric the proof gives 42.9% at 4 tubes and 88.6% at 3 tubes. Those are real results: the recipe badges show the dark sea and sky groups above 6, and the red spread when you drop to 3 tubes is the demo's point. The page leads with what the tubes reach and names the missing tube, so the share stays honest and no number is hidden.

### QA round 1 re-crawl: same three pages, same old sentence

The re-crawl again shows "44% / 88% of the picture is out of reach with this palette", a sentence that is not in the repo (`app/pack/[palette]/page.tsx` leads with "These N tubes mix X% of the picture closely"). The live deploy still predates `63608ec`. The runner should confirm that the redeploy after this pass serves the current `main` (the result page heading copy is the check).

While tracing the 44% I also found a real planner defect behind it. The live page offers "Missing piece: adding Ivory Black" even though Ivory Black is in the student set the plan was built from. `planPalette` picked tubes one at a time, so an early pick could keep a better owned tube out of the bag. That left the dark sea groups above 6 and inflated the red share. Fix: after the greedy pick, `lib/planner.ts` swaps one tube at a time against the other owned tubes until no swap lowers the weighted error. Error can only go down, and the k=3 and k=4 shares drop where a better owned set exists. The proof blocks (README, DEMO, SUBMISSION) regenerate with the new figures on the next `npm run proof`. The 42.9% / 88.6% above come from greedy only.

### QA: external findings
None this round.

### QA round 1, third crawl: stale HTML and chunk 404s

The four-tube pages still showed the pre-`63608ec` sentence, the workspace still offered "Add Ivory Black" (fixed by the swap pass in `4b32a8c`), and `/pack/marmara-dusk-three-tubes` showed the new copy but its `/_next/static` chunks returned 404, so the heatmap frame stayed blank. Root cause: `/pack/[palette]` had no `generateStaticParams` and no dynamic API, so Next 15 cached each visited plan as ISR HTML, and the crawl received HTML from one build whose chunks lived in another. Fix: `export const dynamic = "force-dynamic"` on `app/pack/[palette]/page.tsx`, and `deploymentId` from `VERCEL_DEPLOYMENT_ID` in `next.config.ts` so chunk requests carry `?dpl=` and resolve against the deployment that rendered the page (this routing needs Skew Protection enabled in the Vercel project settings; the runner should confirm it is on).

### QA round 1, fourth crawl: "part to plan around" sentence

The three `/pack/marmara-dusk*` pages showed "The other 33% is the part to plan around, marked in red below. What makes this scene hard: a hot orange sky band that most 3-tube palettes cannot reach." `git log -S "part to plan around"` shows that `85ccbfc` already removed this sentence, so the crawled deploy predates `85ccbfc` (and its `force-dynamic` fix). The runner should check that the deploy it crawls was built from the current `main`. The copy also had two real problems, fixed now. (1) The scene note in `lib/data.ts` talked about 3-tube palettes on a 4-tube page and read as a verdict, so it now says what the sky needs ("yellow and red near full strength"). (2) The result sentence in `app/pack/[palette]/page.tsx` and the downloadable card caption in `components/palette-card.tsx` now lead with the closely mixed share and the tube that helps. The remaining share is still printed with its real number and called out as worth a test swatch. No figure is hidden.

Copy: the result page and the workspace now lead with the share the tubes reach and, when the planner has one, the tube that closes the red areas. The red share itself is unchanged and still shown; it is the planner's real result.
