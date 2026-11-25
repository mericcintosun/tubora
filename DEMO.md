# DEMO: Tubora in 90 seconds

**Problem:** You can't carry 12 tubes to the coast. Which 4?

**Trigger:** a painter is packing for a plein air session at dusk on the Moda pier. They own a 12-tube student set and the bag holds four.

**Wow moment:** on the Marmara sunset with the 12-tube student set, slide the bag down by one tube and the red spreads across the sunset. Click the planner's own "Add <tube>" suggestion and the error comes back down. The tube and the numbers are written by `npm run proof` from the live engine (step 4 below).

**Closing line:** See what's missing before you waste the paint.

Demo start route: `/` (`app/page.tsx`)

## Steps

1. `/`, `app/page.tsx`: the poster headline fills the screen. Click the CTA "Pack my tubes" in the header.
2. `/pack?scene=marmara-dusk`, `app/pack/page.tsx`: the sunset loads and the 12 student-set tubes are ticked.
3. `/pack?scene=marmara-dusk&k=5`, `app/pack/page.tsx` (rendered by `components/pack-workspace.tsx`): the bag fills with 5 tubes and every color group gets a recipe and a mix swatch.
4. Same screen, `components/pack-workspace.tsx`: slide to 3. The stickers change, the red spreads and the average error jumps. Click the planner's "Add <tube>" suggestion and the error drops back. **This is the wow step.**

<!-- PROOF:BEGIN demo-step4 -->
Slide from 4 to 3: average error 5.2 to 9.3, out of reach 43.8% to 87.6%. The planner suggests Quinacridone Rose: error drops to 5.2.
<!-- PROOF:END demo-step4 -->
5. Same screen, `components/phrase-search.tsx`: type "karın üstünde akşam gölgesi" and get the color and its recipe from the packed tubes. The source badge is honest: seed sample until the Adaption run in Phase 4.
6. `/pack/marmara-dusk-four-tubes`, `app/pack/[palette]/page.tsx`: the shared plan, with a copy-link button. `/how` (`app/how/page.tsx`) is the method page for questions.

## Data behind each step

All steps read seed data through `getAdapter()` in `lib/adapter.ts` on the server, or through the `mixEngine` prop in the browser. `ADAPTER_MODE=fake` (the default) mixes with the km-rgb estimate; `ADAPTER_MODE=real` mixes with spectral.js, and the step 4 line above is measured on that engine. The same data is served as JSON at `/api/scenes`, `/api/plans`, `/api/plans/[palette]` and `/api/phrases`.
