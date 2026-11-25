# IDENTITY (contract; every later phase obeys this file)

DIRECTION: D16 candy
GROUND: #fde8e4 blush
SURFACE: #fbd5cf
DEEP: #f7c1ba
LINE: #2a1a1f
INK: #2a1a1f
ACCENT: #d93a25 tomato
ON_ACCENT: #ffffff
SECOND: #e2a400 mustard
OK: #1f7a3d
WARN: #8a5a00
BAD: #b3261e
FONT_DISPLAY: F17 Fredoka (next/font/google: Fredoka)
FONT_BODY: Nunito (next/font/google: Nunito)
FONT_MONO: none
STRUCTURE: S2 landing-workspace
ARCHETYPE: L1 poster
MOTION: M3 scale, prefix tubora-
KIT: K3 scroll
RADIUS: round
HEADER: solid ground, border-b in LINE, sticky
LOGO_POLICY: brand-mark

## Why

The farm assigned this identity so that no two projects share a look, a route map or an interaction style. The most recent projects it differs from: Arbiter Hacks V1 (D1, S3, L5, K5); ML Empowerment Build Challenge 4.0 (250K IN PRIZES!) (D5, S4, L6, K6); PhysTech 2027: Physical Activity and Technology Hack Day (D12, S6, L3, K4). It is not a suggestion. Tie the product's own nouns to it; do not swap any row for a familiar one.

## Direction: D16 candy

Blush pastel with chunky ink outlines and sticker shapes.

Surface treatment: 2px ink outlines on panels and controls, sticker shadows (0 4px 0 the ink color), big pill buttons, slightly rotated badges and labels, playful rounded shapes.

Every hex in app/globals.css comes from the key block above. RADIUS round means 0.75rem and above on every card, panel and control. ON_ACCENT is the text color on an ACCENT fill. The semantic colors (OK, WARN, BAD) mark state only, never brand.

## Structure: S2 landing-workspace

A story landing page that leads into a separate workspace, with shareable result pages.

Route map (name the bracketed parts with the product's own words):
- `/` : the landing page
- `/<verb>` : the workspace, named with the product's own verb (for example `/measure`, never `/app` or `/dashboard`)
- `/<verb>/[id]` : one result as its own shareable page
- `/how` : method and sponsor tech

Rules:
- the landing's one CTA opens the workspace with an example already loaded
- every result has its own URL and a share or copy-link control
- the header has at most three links plus the CTA

## Archetype: L1 poster (the composition of the home route)

Full-bleed typographic hero: the display headline spans the full container at clamp(3.5rem, 9vw, 8rem), the CTA row sits beneath it, and the product appears only below the fold as one full-width live frame.

MUSTs: the headline is the largest element on screen; CTA inside the first viewport; the product frame is full-width.
Bans: any card in the first viewport; any side column at lg.

## Motion: M3 scale (the entrance signature)

scale(0.96) to 1 plus fade, ease-out, 380ms. One keyframe block implements it; every keyframe name starts with `tubora-`. A `prefers-reduced-motion: reduce` block disables it.

## Interaction kit: K3 scroll

Lenis smooth scrolling with Motion scroll-linked values: parallax and scroll chapters.

Packages for package.json dependencies: "lenis": "^1.3.27", "motion": "^14.14.0".

Typical import: `import { ReactLenis } from "lenis/react"; import { motion, useScroll, useTransform } from "motion/react";`

Signature interactions (the scaffold ships the first; all three exist by the end of the frontend phase):
1. a smooth-scrolling root (`<ReactLenis root>` in a client provider) with a progress indicator bound to page scroll
2. parallax depth: at least two layers (an illustration or scene slot and its text) move at different rates through `useTransform`
3. a sticky chapter section where vertical scroll drives the horizontal movement of the product's steps

Rules:
- do not mount Lenis under `(prefers-reduced-motion: reduce)`
- in-page anchor links still work (use `lenis.scrollTo`)
- add the packages above to package.json `dependencies` (and `devDependencies` where listed) with exactly these ranges; the runner installs them
- every import of a kit package lives in a component that starts with `"use client"`
- server HTML must be readable with JavaScript off: never server-render content at opacity 0 or off screen; animate from the visible state or on interaction
- honor `prefers-reduced-motion: reduce`: the content and every control stay usable with motion off
- every interaction is driven by the real seed data; a decorative animation with no product meaning does not count as a signature

## Amendments (append-only; later phases add dated lines here, never edit anything above)
