# CLAUDE.md: Tubora

Read `IDENTITY.md` first (visual contract), then `HANDOFF.md`, then `DEMO.md`.

## Commands
- `npm install`
- `npm run dev`
- `npm run build` (must stay green)
- `npm run seed` (rewrites `fixtures/phrases.json` from `fixtures/phrases.sample.json`, deterministic)

## Stack
Next.js 15 App Router, TypeScript strict, Tailwind v4 with no config file (tokens in `app/globals.css`), deployed on Vercel. Data goes through `getAdapter()` in `lib/adapter.ts` (`ADAPTER_MODE=fake` by default).

## Pitfalls
- `@huggingface/transformers` is not an npm dependency: `components/phrase-search.tsx` loads it from jsDelivr with `import(/* webpackIgnore: true */ url)`, client-side only. Don't add a static import.
- Planner code (`lib/planner.ts`, `lib/color.ts`, `lib/data.ts`) must stay importable on server and client.
- `next.config.ts` reads `fs` at build time only.

## Never touch
`components/scroll-provider.tsx`, `lib/color.ts` math, `lib/planner.ts` algorithms, `public/illustrations/*`, `public/logo.svg`, `app/icon.svg`, `node_modules/`, `.next/`, and `IDENTITY.md` above its Amendments section.

## Vercel guardrails
- no runtime filesystem writes
- `useSearchParams` only under `<Suspense>`
- no Node-only APIs on edge paths
- no custom server, no `output: export`
- every `process.env.X` mirrored in `.env.example`

## Copy rules
- No em dash, no en dash, no double hyphen used as a dash. Use a comma, period, colon or parentheses.
- Banned words: seamless, seamlessly, leverage, empower, revolutionize, streamline, game-changer, cutting-edge, delve, robust, unlock, elevate, harness, effortless, "in today's world", "it's not just X, it's Y".
- Write like a painter talking to a painter.
- Name only technologies in `package.json` at their installed major version.

when compacting preserve the list of modified files and test commands
