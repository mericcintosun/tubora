# DEMO: Tubora in 90 seconds

**Problem:** You can't carry 12 tubes to the coast. Which 4?

**Trigger:** a painter is packing for a plein air session at dusk on the Moda pier. They own a 12-tube student set and the bag holds four.

**Wow moment:** on the Marmara sunset with the 12-tube student set, the slider drops to 3 and the orange sky band glows red, with "Add Cadmium Orange: error drops to X" beside it.

**Closing line:** See what's missing before you waste the paint.

Demo start route: `/` (`app/page.tsx`)

## Steps

1. `/`, `app/page.tsx`: the poster headline fills the screen. Click the CTA "Pack my tubes" in the header.
2. `/pack?scene=marmara-dusk`, `app/pack/page.tsx`: the sunset loads and the 12 student-set tubes are ticked.
3. `/pack?scene=marmara-dusk&k=5`, `app/pack/page.tsx` (rendered by `components/pack-workspace.tsx`): the bag fills with 5 tubes and every color group gets a recipe and a mix swatch.
4. Same screen, `components/pack-workspace.tsx`: slide to 3. The stickers change, the sky glows red and the average error jumps. Click "Add Cadmium Orange" and the red goes out. **This is the wow step.**
5. Same screen, `components/phrase-search.tsx`: type "karın üstünde akşam gölgesi" and get the color and its recipe from the packed tubes. The source badge is honest: seed sample until Phase 2.
6. `/pack/marmara-dusk-four-tubes`, `app/pack/[palette]/page.tsx`: the shared plan, with a copy-link button. `/how` (`app/how/page.tsx`) is the method page for questions.

## Data behind each step

All steps read seed data through `getAdapter()` in `lib/adapter.ts` with `ADAPTER_MODE=fake` (the default). The same data is served as JSON at `/api/scenes`, `/api/plans`, `/api/plans/[palette]` and `/api/phrases`.
