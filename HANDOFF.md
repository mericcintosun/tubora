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
- `components/scroll-provider.tsx`: Lenis root, tube-rack scroll progress bar, `AnchorLink`.
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

- Shipped: signature 1. `<ReactLenis root>` mounted by `ScrollProvider` (skipped under reduced motion) plus a progress bar bound to `useScroll().scrollYProgress`, drawn as the 16 catalog pigments. `AnchorLink` uses `lenis.scrollTo` for `#live-frame`.
- To build: signature 2, parallax depth. On `/` move the scene-2 illustration and its problem copy at different rates with `useTransform`.
- To build: signature 3, a sticky chapter section where vertical scroll drives horizontal movement through the steps (cluster, mix, pick, heatmap), ideally showing the Marmara plan at each stage from real `planPalette` output.

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

## 5. Definition of done

- Deployed on Vercel at https://tubora.vercel.app, README demo link live, repo public.
- The 90-second flow above works end to end on seed data, with no console errors.
- The 4 to 3 slider moment rehearsed and recorded.
- Devpost submitted, Google Form filled, Zoom slot confirmed for 3 Jan 2027.
