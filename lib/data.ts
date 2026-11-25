// Tubora seed data: the tube catalog, the reference scenes the workspace can load, and the
// saved palette plans that back the shareable /pack/[palette] pages.
// Tube colors are sRGB estimates of masstone swatches, not measured spectra (see README).

import type { RGB } from "./color";

export interface Tube {
  id: string;
  /** Colour Index pigment code printed on the tube. */
  code: string;
  name: string;
  /** Short label used inside recipes. */
  short: string;
  rgb: RGB;
}

export const TUBES: Tube[] = [
  { id: "titanium-white", code: "PW6", name: "Titanium White", short: "White", rgb: [244, 243, 236] },
  { id: "cadmium-yellow-light", code: "PY35", name: "Cadmium Yellow Light", short: "Cad Yellow", rgb: [252, 211, 0] },
  { id: "yellow-ochre", code: "PY42", name: "Yellow Ochre", short: "Ochre", rgb: [196, 146, 58] },
  { id: "cadmium-orange", code: "PO20", name: "Cadmium Orange", short: "Cad Orange", rgb: [238, 112, 24] },
  { id: "cadmium-red-light", code: "PR108", name: "Cadmium Red Light", short: "Cad Red", rgb: [214, 46, 36] },
  { id: "red-oxide", code: "PR101", name: "Red Oxide", short: "Red Oxide", rgb: [152, 60, 44] },
  { id: "quinacridone-rose", code: "PV19", name: "Quinacridone Rose", short: "Quin Rose", rgb: [188, 32, 92] },
  { id: "dioxazine-purple", code: "PV23", name: "Dioxazine Purple", short: "Purple", rgb: [68, 30, 92] },
  { id: "ultramarine-blue", code: "PB29", name: "Ultramarine Blue", short: "Ultramarine", rgb: [32, 38, 148] },
  { id: "phthalo-blue", code: "PB15:3", name: "Phthalo Blue", short: "Phthalo Blue", rgb: [12, 52, 118] },
  { id: "cerulean-blue", code: "PB35", name: "Cerulean Blue", short: "Cerulean", rgb: [44, 118, 176] },
  { id: "viridian", code: "PG18", name: "Viridian", short: "Viridian", rgb: [32, 108, 88] },
  { id: "chromium-oxide-green", code: "PG17", name: "Chromium Oxide Green", short: "Chrome Green", rgb: [92, 116, 62] },
  { id: "burnt-sienna", code: "PBr7", name: "Burnt Sienna", short: "B. Sienna", rgb: [138, 62, 32] },
  { id: "raw-umber", code: "PBr7 (raw)", name: "Raw Umber", short: "Raw Umber", rgb: [96, 76, 56] },
  { id: "ivory-black", code: "PBk9", name: "Ivory Black", short: "Black", rgb: [32, 29, 29] },
];

/** A typical 12-tube student set: what most people actually own. */
export const STUDENT_SET = [
  "titanium-white",
  "cadmium-yellow-light",
  "yellow-ochre",
  "cadmium-red-light",
  "red-oxide",
  "quinacridone-rose",
  "ultramarine-blue",
  "phthalo-blue",
  "viridian",
  "burnt-sienna",
  "raw-umber",
  "ivory-black",
];

/** Layers of a procedurally painted reference. Coordinates are fractions of the frame. */
export type SceneLayer =
  | { kind: "vgrad"; y0: number; y1: number; top: RGB; bottom: RGB }
  | { kind: "disc"; cx: number; cy: number; r: number; color: RGB }
  | { kind: "ridge"; base: number; amp: number; freq: number; phase: number; top: RGB; bottom: RGB }
  | { kind: "rect"; x0: number; y0: number; x1: number; y1: number; color: RGB };

export interface Scene {
  id: string;
  title: string;
  place: string;
  /** What makes this reference hard for a small palette. */
  challenge: string;
  layers: SceneLayer[];
}

export const SCENES: Scene[] = [
  {
    id: "marmara-dusk",
    title: "Dusk over the Sea of Marmara",
    place: "Moda pier, Istanbul",
    challenge: "A hot orange sky band that needs yellow and red near full strength.",
    layers: [
      { kind: "vgrad", y0: 0, y1: 0.3, top: [92, 58, 112], bottom: [214, 96, 70] },
      { kind: "vgrad", y0: 0.3, y1: 0.58, top: [236, 118, 34], bottom: [250, 186, 60] },
      { kind: "disc", cx: 0.66, cy: 0.52, r: 0.07, color: [255, 226, 120] },
      { kind: "ridge", base: 0.56, amp: 0.025, freq: 3, phase: 0.4, top: [70, 52, 86], bottom: [60, 46, 78] },
      { kind: "vgrad", y0: 0.6, y1: 1, top: [58, 48, 96], bottom: [22, 24, 56] },
      { kind: "rect", x0: 0.6, y0: 0.62, x1: 0.72, y1: 0.95, color: [226, 128, 52] },
    ],
  },
  {
    id: "cappadocia-snow",
    title: "Snow at evening, Cappadocia",
    place: "Love Valley, Nevşehir",
    challenge: "Blue-violet snow shadows next to warm ochre rock.",
    layers: [
      { kind: "vgrad", y0: 0, y1: 0.45, top: [150, 150, 196], bottom: [236, 196, 186] },
      { kind: "ridge", base: 0.42, amp: 0.12, freq: 5, phase: 1.2, top: [196, 150, 96], bottom: [150, 102, 64] },
      { kind: "ridge", base: 0.62, amp: 0.05, freq: 2, phase: 0.2, top: [236, 236, 244], bottom: [140, 146, 196] },
      { kind: "rect", x0: 0.18, y0: 0.7, x1: 0.24, y1: 0.86, color: [74, 56, 48] },
    ],
  },
  {
    id: "olive-grove-noon",
    title: "Olive grove at noon",
    place: "Cunda Island, Ayvalık",
    challenge: "Silvery greens that turn to mud with the wrong blue.",
    layers: [
      { kind: "vgrad", y0: 0, y1: 0.45, top: [86, 140, 204], bottom: [184, 214, 232] },
      { kind: "ridge", base: 0.4, amp: 0.08, freq: 7, phase: 0.6, top: [122, 140, 104], bottom: [84, 100, 70] },
      { kind: "ridge", base: 0.58, amp: 0.06, freq: 9, phase: 2.1, top: [150, 162, 126], bottom: [96, 112, 80] },
      { kind: "vgrad", y0: 0.78, y1: 1, top: [200, 162, 104], bottom: [168, 120, 72] },
    ],
  },
  {
    id: "north-light-portrait",
    title: "Portrait under north light",
    place: "Studio, Kadıköy",
    challenge: "Skin tones against a near-black ground: the classic Zorn test.",
    layers: [
      { kind: "vgrad", y0: 0, y1: 1, top: [52, 44, 40], bottom: [26, 22, 22] },
      { kind: "disc", cx: 0.5, cy: 0.42, r: 0.22, color: [212, 160, 128] },
      { kind: "disc", cx: 0.56, cy: 0.46, r: 0.12, color: [168, 112, 88] },
      { kind: "ridge", base: 0.72, amp: 0.05, freq: 1, phase: 1.6, top: [120, 50, 40], bottom: [82, 36, 32] },
    ],
  },
  {
    id: "harbour-fog",
    title: "Morning fog in the harbour",
    place: "Karaköy ferry docks, Istanbul",
    challenge: "Twelve near-identical greys; tells you if black is worth carrying.",
    layers: [
      { kind: "vgrad", y0: 0, y1: 0.55, top: [196, 196, 200], bottom: [170, 172, 178] },
      { kind: "ridge", base: 0.5, amp: 0.04, freq: 4, phase: 0.9, top: [128, 130, 140], bottom: [110, 112, 122] },
      { kind: "vgrad", y0: 0.58, y1: 1, top: [140, 142, 148], bottom: [92, 94, 102] },
      { kind: "rect", x0: 0.3, y0: 0.46, x1: 0.5, y1: 0.6, color: [70, 64, 66] },
    ],
  },
];

export interface SavedPlan {
  /** Readable slug used as the shareable /pack/[palette] id. */
  id: string;
  sceneId: string;
  painter: string;
  city: string;
  k: number;
  owned: string[];
  savedAt: string;
  note: string;
}

export const SAVED_PLANS: SavedPlan[] = [
  {
    id: "marmara-dusk-four-tubes",
    sceneId: "marmara-dusk",
    painter: "Selin Aydın",
    city: "Istanbul",
    k: 4,
    owned: STUDENT_SET,
    savedAt: "2026-11-02",
    note: "Plein air session on the pier, 40 minutes before the light went.",
  },
  {
    id: "marmara-dusk-three-tubes",
    sceneId: "marmara-dusk",
    painter: "Mateo Ruiz",
    city: "Valencia",
    k: 3,
    owned: STUDENT_SET,
    savedAt: "2026-11-04",
    note: "Tried to go minimal. The sky band told me no.",
  },
  {
    id: "cappadocia-snow-five",
    sceneId: "cappadocia-snow",
    painter: "Hana Kobayashi",
    city: "Osaka",
    k: 5,
    owned: [...STUDENT_SET, "dioxazine-purple", "cerulean-blue"],
    savedAt: "2026-10-28",
    note: "Purple earned its place in the snow shadows.",
  },
  {
    id: "olive-grove-four",
    sceneId: "olive-grove-noon",
    painter: "Deniz Kaya",
    city: "Ayvalık",
    k: 4,
    owned: [...STUDENT_SET, "cerulean-blue", "chromium-oxide-green"],
    savedAt: "2026-09-19",
    note: "Left the phthalo at home and the greens stayed silver.",
  },
  {
    id: "zorn-portrait-four",
    sceneId: "north-light-portrait",
    painter: "Ola Nordqvist",
    city: "Mora",
    k: 4,
    owned: ["titanium-white", "yellow-ochre", "cadmium-red-light", "red-oxide", "ivory-black", "burnt-sienna", "ultramarine-blue"],
    savedAt: "2026-10-11",
    note: "Checking whether the Zorn four really cover a studio head.",
  },
  {
    id: "harbour-fog-three",
    sceneId: "harbour-fog",
    painter: "Priya Raman",
    city: "Bengaluru",
    k: 3,
    owned: STUDENT_SET,
    savedAt: "2026-11-09",
    note: "Three tubes, all greys mixed, no black needed.",
  },
  {
    id: "cappadocia-snow-three",
    sceneId: "cappadocia-snow",
    painter: "Lucía Ferrer",
    city: "Granada",
    k: 3,
    owned: STUDENT_SET,
    savedAt: "2026-11-14",
    note: "The rock reads fine; the violet shadows go grey.",
  },
  {
    id: "olive-grove-six",
    sceneId: "olive-grove-noon",
    painter: "Tom Becker",
    city: "Leipzig",
    k: 6,
    owned: TUBES.map((t) => t.id),
    savedAt: "2026-11-20",
    note: "Full catalog to see the ceiling before cutting down.",
  },
];

export const DEFAULT_SCENE_ID = "marmara-dusk";
export const DEFAULT_K = 4;

export const tubeById = (id: string) => TUBES.find((t) => t.id === id);
export const sceneById = (id: string) => SCENES.find((s) => s.id === id);
export const planById = (id: string) => SAVED_PLANS.find((p) => p.id === id);
