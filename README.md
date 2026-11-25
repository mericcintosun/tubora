# Tubora

Drop in a reference photo and tick the paints you own. Tubora picks the best few tubes to carry for that picture, gives a mixing recipe for every color in it, and lights up in red the parts those tubes will never reach.

> Live demo: https://tubora.vercel.app

## The problem

A painter working outdoors, or anyone learning a limited palette (the Zorn four, say), owns twelve tubes but can carry four. Which four? Today you find out on site, after the sky has gone to mud.

The mixing apps we found (Undertint, Mixable, Real Paint mixing tools) answer one color at a time: tap a pixel, get a two or three tube recipe. Palette simulators go the other way and preview a palette you already chose. None of them chooses the subset of tubes for the whole picture.

## The solution

Tubora treats palette packing as an optimization problem over the entire reference:

1. **Cluster.** The image is scaled to 96 by 64 pixels and grouped into 24 colors with k-means in OKLab. Each group is weighted by how much of the canvas it covers.
2. **Mix.** Every 1, 2 and 3 tube combination of a 16-pigment catalog (PW6, PY35, PY42, PO20, PR108, PR101, PV19, PV23, PB29, PB15:3, PB35, PG18, PG17, PBr7 and friends) is mixed on a six-part grid with a Kubelka-Munk model: 6,216 candidate mixes. Which Kubelka-Munk model depends on the build, see "Mixing engine" below.
3. **Pick.** A greedy pass adds whichever owned tube cuts the picture's weighted CIEDE2000 error the most, until the bag holds `k` tubes.
4. **Show the gap.** Every pixel is compared with the best mix its group can reach. Anything more than 6 CIEDE2000 units off turns red. The same pass names the tube that would help most if you made room for it.

The demo moment: on the Marmara sunset with a 12-tube student set, slide from 4 tubes to 3 and the orange band of sky lights up red. Click "Add Cadmium Orange" and it goes away.

Every plan has its own URL (`/pack/marmara-dusk.k4.<owned-mask>` or a saved slug like `/pack/marmara-dusk-four-tubes`) with a copy-link button.

There is also a **"describe a color"** box. Type "karın üstünde akşam gölgesi" or "evening shadow on snow" and Tubora finds the closest painter phrase, then mixes it from the tubes you packed.

## Mixing engine

The planner builds its mix table with one of two engines, chosen by `ADAPTER_MODE` on the server and passed to the browser as a plain prop. The workspace and every shared plan page name the engine in a badge under the error readout.

- `ADAPTER_MODE=real`: **spectral.js** (`lib/mix/spectral.ts`). Each tube's sRGB color becomes a reflectance curve, the curves mix with Kubelka-Munk, and the result comes back to sRGB. Blue and yellow land on green the way paint does.
- `ADAPTER_MODE=fake` (the default): a three-channel Kubelka-Munk estimate written from scratch (`kmMix` in `lib/color.ts`). It runs anywhere and stays as the fallback engine.

Both engines feed the same planner code and the same screens. Each table is built once per engine and kept in memory. No key is needed for either.

<!-- PROOF:BEGIN mix-engine -->
Ultramarine Blue and Cadmium Yellow Light, 1:1. Hue is the OKLab hue angle (green sits near 140°).

| Engine | Mix | Hue | Mixes in table | Table build (ms) |
| --- | --- | --- | --- | --- |
| km-rgb | rgb(47, 54, 7) | 118° | 6216 | 60 |
| spectral | rgb(119, 146, 61) | 124° | 6216 | 188 |

spectral.js answered every spectral mix in this run.
<!-- PROOF:END mix-engine -->

The demo moment in numbers (`npm run proof` fills this in):

<!-- PROOF:BEGIN wow-numbers -->
Dusk over the Sea of Marmara, 12-tube student set.

| Engine | Tubes | Avg error (CIEDE2000) | Out of reach | Suggestion |
| --- | --- | --- | --- | --- |
| km-rgb | 5 | 6.13 | 53.6% | Cadmium Orange, error drops to 4.4 |
| km-rgb | 4 | 7.10 | 60.3% | Cadmium Orange, error drops to 4.9 |
| km-rgb | 3 | 9.24 | 67.4% | Cadmium Orange, error drops to 7.1 |
| spectral | 5 | 4.04 | 24.3% | none |
| spectral | 4 | 5.20 | 43.8% | Ivory Black, error drops to 4.0 |
| spectral | 3 | 9.29 | 87.6% | Quinacridone Rose, error drops to 5.2 |
<!-- PROOF:END wow-numbers -->

Tests:

<!-- PROOF:BEGIN tests -->
`npx tsx --test tests/mix.test.ts`: 7 passed, 0 failed.
<!-- PROOF:END tests -->

## How it uses the sponsor tech

**Adaption (Adaption AI Application Award).** The phrase box searches a multilingual set of painter color phrases (English, Turkish, Spanish), each labelled with a target color, hue family, value and chroma. That set is generated with **Adaption Invent** by `scripts/adaption_invent.py`, which estimates the credit cost first, invents about 600 rows, pulls Adaption's dataset evaluation score and downloads JSONL. The live site ships the generated rows and shows each row's Adaption quality score next to the match. Without the Adaption set there is nothing to search, so the feature depends on it.

Status today: the script is written and the web search runs, against 18 hand-written seed rows in the same shape. The UI labels them as seed samples until the Adaption run lands.

**In-browser AI, no keys.** Queries are embedded in the browser with Transformers.js (`Xenova/paraphrase-multilingual-MiniLM-L12-v2`) and matched by cosine similarity. If the model cannot load, a keyword matcher takes over and the UI says which one answered.

## Tech stack

- Next.js 15 (App Router), TypeScript strict, Tailwind CSS v4, shadcn-style primitives
- Color science written from scratch in `lib/color.ts`: OKLab, CIE Lab, CIEDE2000, per-channel Kubelka-Munk
- spectral.js 3 for reflectance mixing when `ADAPTER_MODE=real`
- zod at the API edge (`lib/schemas.ts`)
- Planner in `lib/planner.ts`: k-means, mix table, greedy selection, per-pixel error, shareable plan ids
- HTML Canvas for the heatmap
- `@huggingface/transformers` for multilingual sentence embeddings in the browser
- Adaption Python SDK (build-time script) for the phrase dataset
- A dependency-free tube-rack scroll indicator with native smooth scrolling
- Deployed on Vercel

## Quickstart

```bash
npm install
npm run dev
# open http://localhost:3000
npm test          # mixing engine checks (node:test through tsx)
npm run proof     # measures both engines and rewrites the PROOF blocks in this README
```

No environment variables are needed to run the app: `ADAPTER_MODE` defaults to `fake`, which serves the seed scenes, saved plans and phrase rows with the three-channel estimate engine. Set `ADAPTER_MODE=real` for spectral.js mixing; it needs no key. The six-step demo script lives in `DEMO.md`.

To regenerate the phrase set with Adaption:

```bash
pip install adaption
ADAPTION_API_KEY=your-key python scripts/adaption_invent.py
```

See `.env.example`. Without a key the script writes the seed sample rows so the rest of the pipeline still runs.

## Honest limits

- Tube colors are sRGB estimates of masstone swatches, not measured reflectance. Brands differ. Mix a small test swatch first.
- The spectral engine rebuilds each tube's reflectance curve from its sRGB estimate, so it mixes better hues than the three-channel fallback but is only as good as those estimates. The fallback (`ADAPTER_MODE=fake`) misses some hue shifts the spectral engine catches.
- Tinting strength is ignored: one part phthalo is not one part ochre.

## What we would build next

- Build the spectral mix table inside a Web Worker so a large upload never blocks the slider.
- Brand-specific tube sets measured from real swatches, so "my Winsor & Newton box" is one click.
- A printable palette card (tube list, top recipes, heatmap thumbnail) as one PNG for the field bag.
- Shareable plans for uploaded photos, stored as cluster summaries rather than pixels.

## AI use

<!-- Adjust this section to each hackathon's disclosure rules. -->

We used AI coding assistants for scaffolding and boilerplate. Architecture, product decisions, and final code review are our own.
