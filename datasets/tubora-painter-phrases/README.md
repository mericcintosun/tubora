---
license: cc-by-4.0
language:
  - en
  - tr
  - es
task_categories:
  - text-classification
pretty_name: Tubora painter color phrases
size_categories:
  - n<1K
---

# Tubora painter color phrases

Phrases a painter would use to describe one color they want to mix ("evening shadow on snow", "karın üstünde akşam gölgesi", "tierra ocre seca al mediodía"), each labelled with a target sRGB color and three coarse descriptors. Tubora's "describe a color" box searches this set in the browser and mixes the match from the tubes the painter packed.

Adaptive Data by Adaption.

## Fields

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | `a0001` and up for generated rows |
| `text` | string | The phrase as a painter would say it |
| `lang` | `en`, `tr` or `es` | Language of the phrase |
| `rgb` | [int, int, int] | Target color in sRGB, 0 to 255 |
| `hue` | string | One of red, red-brown, orange, yellow-orange, yellow, grey-green, green, blue, blue-violet, violet-blue, violet, neutral |
| `value` | `dark`, `mid` or `light` | Lightness band |
| `chroma` | `muted`, `moderate` or `vivid` | Saturation band |
| `source` | string | `adaption-invent` |
| `quality` | number or null | Adaption dataset evaluation `score_after` for the run |

## Languages

English, Turkish and Spanish, roughly a third each.

## How it was made

Generated with Adaption Invent by [`scripts/adaption_invent.py`](https://github.com/mericcintosun/tubora/blob/main/scripts/adaption_invent.py) in the Tubora repo. The script estimates the credit cost, runs `datasets.invent` as an instruction dataset, reads the dataset evaluation, downloads JSONL, drops rows with an unknown language, a bad hex or a value outside the enums above, and writes `data/painter-phrases.jsonl` (this file's data).

## Limits

Target colors are what a language model thought the phrase looks like on screen, not measured paint. Use them as a starting swatch.
