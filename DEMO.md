# DEMO: Tubora in 90 seconds

**Problem:** You can't carry 12 tubes to the coast. Which 4?

**Trigger:** a painter is packing for a plein air session at dusk on the Moda pier. They own a 12-tube student set and the bag holds four.

**Wow moment:** on the Marmara sunset with the 12-tube student set, slide the bag down by one tube and the red spreads across the sunset. Click the planner's own "Add <tube>" suggestion and the error comes back down. The tube and the numbers are written by `npm run proof` from the live engine (step 4 below).

**Closing line:** See what's missing before you waste the paint.

Demo start route: `/` (`app/page.tsx`)

## Steps

1. `/`, `app/page.tsx`: the poster headline fills the screen and thins as you scroll. Click the CTA "Pack my tubes" in the header or under the headline (same label, same link).
2. `/pack?scene=marmara-dusk`, `app/pack/page.tsx`: the sunset loads and the 12 student-set tubes are ticked.
3. `/pack?scene=marmara-dusk&k=5`, `app/pack/page.tsx` (rendered by `components/pack-workspace.tsx`): the bag fills with 5 tubes and every color group gets a recipe and a mix swatch.
4. Same screen, `components/pack-workspace.tsx`: slide to 3. The stickers change, the red spreads and the average error jumps. Click the planner's "Add <tube>" suggestion and the error drops back. **This is the wow step.**

<!-- PROOF:BEGIN demo-step4 -->
Slide from 4 to 3: average error 5.2 to 9.3, out of reach 42.9% to 88.6%. The planner suggests Quinacridone Rose: error drops to 5.2.
<!-- PROOF:END demo-step4 -->
5. Same screen, `components/phrase-search.tsx`: type "karın üstünde akşam gölgesi" and get the color and its recipe from the packed tubes. The corpus is whatever `fixtures/phrases.sample.json` holds: today the 18 seed rows, so the badge reads "seed sample, awaiting Adaption run". Once `scripts/adaption_invent.py` has written Adaption rows, `activePhrases()` in `lib/phrases.ts` serves those instead and the match shows the line "Adaption evaluation: score X to Y (+Z%)". The README `adaption` proof block says which case this build is in.
6. `/pack/marmara-dusk-four-tubes`, `app/pack/[palette]/page.tsx`: the shared plan, with a copy-link button. `/how` (`app/how/page.tsx`) is the method page for questions.
7. `/pack/marmara-dusk-four-tubes`, `app/pack/[palette]/page.tsx` (`components/palette-card.tsx`): click Download palette card, a PNG with the 4 tubes, 8 recipes and the heatmap thumbnail downloads.

## Data behind each step

All steps read seed data through `getAdapter()` in `lib/adapter.ts` on the server, or through the `mixEngine` prop in the browser. `ADAPTER_MODE=fake` (the default) mixes with the km-rgb estimate; `ADAPTER_MODE=real` mixes with spectral.js, and the step 4 line above is measured on that engine. The same data is served as JSON at `/api/scenes`, `/api/plans`, `/api/plans/[palette]` and `/api/phrases`. The step 7 card is drawn in the browser from the same plan the page shows.
