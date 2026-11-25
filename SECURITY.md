# Security

Tubora is a Next.js web app that plans paint palettes. It has no wallet, no account system, no database and no chain. This file says so section by section, with the checks behind each line.

## Contracts and chain

None. There is no `contracts/` directory, no Solidity, no deployed contract and no chain id. The app never talks to an RPC endpoint.

## Wallet permissions requested

None. The app never asks for a wallet connection, a signature or an account. Searched over `app/`, `components/`, `lib/` and `scripts/`, each of these finds nothing:

- `eth_requestAccounts`: no match
- `connect(`: no match
- `eth_sign`: no match
- `personal_sign`: no match

A browser wallet extension should therefore show no prompt and no Blockaid warning on https://tubora.vercel.app.

## Approvals and spenders

None. With no wallet access there are no token approvals, no spender addresses and nothing to revoke.

## Source and data

- Source: https://github.com/mericcintosun/tubora
- Nothing is stored on a server. Share links carry the whole plan in the URL, uploaded photos are read into a canvas in the browser, and the phrase box query never leaves the browser.
- The `/api/*` routes are GET only. `/api/mix` and `/api/plans/[palette]` validate their input with zod (`lib/schemas.ts`); `/api/scenes`, `/api/plans` and `/api/phrases` take no input.
- Third-party hosts the browser contacts: **cdn.jsdelivr.net** (the Transformers.js library) and **huggingface.co** (the multilingual embedding model weights). Both are fetched only when you use the phrase box, and the page says so next to it.
- `ADAPTION_API_KEY` is a build-time-only key, read only by `scripts/adaption_invent.py` on the builder's machine. The Next.js app never reads it and it is not set on Vercel. `.env.example` holds an empty placeholder; no real key is committed.
- The only `NEXT_PUBLIC_` value is `NEXT_PUBLIC_BRAND_FILES`, a list of public image file names.

## Reporting

Open an issue on the repository, or for anything sensitive, contact the maintainer through the GitHub profile linked from the repository.
