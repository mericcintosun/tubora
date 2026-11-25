# SUBMISSION: Tubora at InnovArt 2027

Fields per Devpost default form, not verified on this event (the rules page returned 403 to our fetch). Copy each block into the matching field.

## Devpost project

**Project name:** Tubora

**Tagline** (under 150 characters, limit 200):

Tick the paints you own and Tubora picks the tubes to carry for one picture, with a recipe for every color and the unreachable parts lit up in red.

### About the project

**Inspiration**

Plein air painters own twelve tubes and carry four. Which four? Most of us find out on the pier, after the sky on the board has gone to mud. The mixing apps we tried answer one color at a time; none of them chooses the subset of tubes for the whole picture.

**What it does**

Open a reference picture and tick the tubes you own. Tubora clusters the picture into 24 color groups, mixes every one, two and three tube combination of a 16 pigment catalog, and greedily packs the number of tubes you choose on the slider. Every color group gets a recipe, and every pixel the packed tubes cannot reach turns red, so you see what is missing before you waste paint. The planner also names the one tube that would help most. Each plan has its own shareable page and a palette card PNG for the field bag. A phrase box turns "evening shadow on snow" or "karın üstünde akşam gölgesi" into a target color and mixes it from the packed tubes.

On the Marmara sunset with a 12 tube student set, the demo moment reads:

<!-- PROOF:BEGIN demo-step4 -->
Slide from 4 to 3: average error 5.2 to 9.3, out of reach 43.8% to 87.6%. The planner suggests Quinacridone Rose: error drops to 5.2.
<!-- PROOF:END demo-step4 -->

**How we built it**

Next.js 15 and React 19 with TypeScript, Tailwind CSS v4 and shadcn style primitives. The color science (OKLab, CIE Lab, CIEDE2000, a three channel Kubelka-Munk estimate) is written from scratch in `lib/color.ts`; spectral.js 3 does reflectance mixing when the deploy runs `ADAPTER_MODE=real`. The planner in `lib/planner.ts` does k-means, the mix table, greedy selection and the per pixel error map, and runs both on the server and in the browser. Phrase search embeds the query in the browser with Transformers.js (`Xenova/paraphrase-multilingual-MiniLM-L12-v2`) and falls back to a keyword matcher. The phrase set is built by `scripts/adaption_invent.py` with the Adaption Python SDK (Adaption Invent). Lenis and Motion drive the scroll on the landing page.

**Challenges we ran into**

Blue and yellow have to land on green the way paint does, which screen color averaging never gives you; that is why the mix table runs on a Kubelka-Munk model and, in the real build, on spectral.js reflectance curves. Keeping a 6,216 mix table and a greedy pick under a slider drag took care.

**Accomplishments that we're proud of**

The 4 to 3 slider moment: the red spreads across the sunset, and the planner's own suggestion pulls the error back down. The step 4 numbers above are written into this file by `npm run proof` from the planner, not by hand.

**What we learned**

Painters think in tubes and phrases, not hex codes, and a palette is a subset problem over the whole picture, not a recipe problem one pixel at a time.

**What's next**

Run the Adaption Invent job and publish the phrase set on Hugging Face, build the mix table in a Web Worker so large uploads never block the slider, and measure real brand tube sets from swatches.

### Built with

next, react, typescript, tailwindcss, spectral.js, zod, lenis, motion, lucide-react, class-variance-authority, @radix-ui/react-slot, clsx, tailwind-merge, tsx, Adaption Python SDK (`scripts/adaption_invent.py`)

### Try it out

- https://tubora.vercel.app
- https://github.com/mericcintosun/tubora

### Adaption claim, as it stands in this build

The phrase box searches seed rows until the Adaption run lands: `fixtures/phrases.sample.json` holds hand written seed rows and the screen labels every match "seed sample, awaiting Adaption run". The script that produces the Adaption rows and evaluation is in the repo and runs with a key. The README `adaption` block says which case the build is in:

<!-- PROOF:BEGIN adaption -->
Not run in this build: no Adaption rows in fixtures/phrases.sample.json, the corpus is 18 seed rows.
<!-- PROOF:END adaption -->

## Tracks targeted

| Track | action |
| --- | --- |
| Grand Prize | the main Devpost submission |
| Adaption AI Application Award | the main Devpost submission; replace this line with the opt-in string once Discord answers |
| Excellence in Creativity Award | the main Devpost submission |

## Google Form (presentation registration)

The fields the agent can fill. Presenter name and contact, country and time zone are filled by the builder (see the checklist at the end of `HANDOFF.md`).

**Project title:** Tubora

**One-paragraph summary:**

Tubora helps a painter decide which few tubes to carry for one reference picture. Tick the tubes you own and choose how many fit in the bag; Tubora clusters the picture, mixes every one, two and three tube combination with a Kubelka-Munk model, packs the best tubes, gives a recipe for every color and lights up in red the parts those tubes can never reach, naming the one tube that would help most. Every plan has its own shareable page and a palette card for the field bag.

**Public project link:** https://tubora.vercel.app
