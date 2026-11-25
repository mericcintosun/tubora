// Zod schemas for everything that enters through an API route. Routes call safeParse first.

import { z } from "zod";
import { TUBES } from "./data";

const TUBE_IDS = new Set(TUBES.map((t) => t.id));

/** A saved slug (`marmara-dusk-four-tubes`) or an encoded id (`marmara-dusk.k4.1a3f`). */
export const PaletteParamSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9.-]+$/, "Use lowercase letters, digits, dots and hyphens only.");

/** Query strings arrive as "a,b,c"; tests and code may pass arrays. Both become arrays. */
const csv = (v: unknown) => (typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : v);

export const MixEngineSchema = z.enum(["km-rgb", "spectral"]);

export const MixQuerySchema = z
  .object({
    tubes: z.preprocess(
      csv,
      z
        .array(z.string())
        .min(2)
        .max(3)
        .refine((ids) => ids.every((id) => TUBE_IDS.has(id)), { message: "Unknown tube id." })
        .refine((ids) => new Set(ids).size === ids.length, { message: "Each tube once." })
    ),
    parts: z.preprocess(
      csv,
      z
        .array(z.coerce.number().int().positive())
        .min(2)
        .max(3)
        .refine((p) => p.reduce((s, x) => s + x, 0) <= 12, { message: "Parts must add up to 12 or less." })
    ),
    engine: MixEngineSchema.optional(),
  })
  .refine((q) => q.tubes.length === q.parts.length, { message: "Give one part count per tube.", path: ["parts"] });

export type MixQuery = z.infer<typeof MixQuerySchema>;
