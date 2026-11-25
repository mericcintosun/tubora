"""Generate Tubora's multilingual painter color phrase set with Adaption Invent.

Run once on the builder's machine (never on Vercel):

    pip install adaption
    ADAPTION_API_KEY=... python scripts/adaption_invent.py

Two paths in one function, `build_phrase_set`:
  * with ADAPTION_API_KEY: estimate the credit cost, invent about 600 rows (English,
    Turkish, Spanish), fetch Adaption's evaluation score, download JSONL.
  * without a key: write the hand-made seed sample rows from lib/phrases.ts in the same
    JSONL shape, tagged source="seed-sample", so the pipeline downstream still runs.

Output: data/painter-phrases.jsonl. Convert it into lib/phrases.ts rows with
source="adaption-invent" and quality=<evaluation score> (see HANDOFF.md).

NOTE: SDK method names follow the Adaption invent-a-dataset docs as read during ideation
(datasets.invent, estimate=True, get_evaluation, download). Check them against
https://docs.adaptionlabs.ai/adaptive-data/invent-a-dataset/ before the first paid run.
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "data" / "painter-phrases.jsonl"

PROMPT = (
    "Phrases a painter would use to describe one specific color they want to mix, "
    "taken from landscapes, portraits and still life (for example 'evening shadow on snow'). "
    "Write each phrase in English, Turkish or Spanish, roughly a third each. "
    "For every phrase give the target color as an sRGB hex, a hue family "
    "(red, red-brown, orange, yellow-orange, yellow, grey-green, green, blue, blue-violet, "
    "violet-blue, violet, neutral), a value (dark, mid, light) and a chroma (muted, moderate, vivid)."
)

SCHEMA = {
    "text": "string",
    "lang": "one of en, tr, es",
    "hex": "sRGB hex like #8084b8",
    "hue": "hue family",
    "value": "dark | mid | light",
    "chroma": "muted | moderate | vivid",
}

SEED_SAMPLE = [
    {"text": "evening shadow on snow", "lang": "en", "hex": "#8084b8", "hue": "blue-violet", "value": "mid", "chroma": "moderate"},
    {"text": "karın üstünde akşam gölgesi", "lang": "tr", "hex": "#7c80b6", "hue": "blue-violet", "value": "mid", "chroma": "moderate"},
    {"text": "sunset sky just above the sea", "lang": "en", "hex": "#f0842c", "hue": "orange", "value": "light", "chroma": "vivid"},
    {"text": "tierra ocre seca al mediodía", "lang": "es", "hex": "#c0985e", "hue": "yellow-orange", "value": "mid", "chroma": "moderate"},
]


def build_phrase_set(rows: int = 600) -> dict:
    api_key = os.environ.get("ADAPTION_API_KEY")
    OUT.parent.mkdir(parents=True, exist_ok=True)

    if not api_key:
        # Keyless path: same file shape, clearly tagged, no network call.
        with OUT.open("w", encoding="utf-8") as f:
            for r in SEED_SAMPLE:
                f.write(json.dumps({**r, "source": "seed-sample", "quality": None}, ensure_ascii=False) + "\n")
        return {"path": str(OUT), "rows": len(SEED_SAMPLE), "source": "seed-sample", "quality": None}

    # Real path: Adaption Invent.
    from adaption import Adaption  # imported here so the keyless path needs no install

    client = Adaption(api_key=api_key)

    estimate = client.datasets.invent(prompt=PROMPT, schema=SCHEMA, num_rows=rows, estimate=True)
    print(f"Adaption estimate: {estimate}", file=sys.stderr)

    job = client.datasets.invent(prompt=PROMPT, schema=SCHEMA, num_rows=rows, name="tubora-painter-phrases")
    dataset_id = getattr(job, "id", None) or job["id"]

    # Invent runs asynchronously: poll until the dataset is ready.
    while True:
        status = client.datasets.get(dataset_id)
        state = getattr(status, "status", None) or status.get("status")
        if state in ("completed", "succeeded", "ready"):
            break
        if state in ("failed", "error"):
            raise RuntimeError(f"Adaption invent failed: {status}")
        time.sleep(15)

    evaluation = client.datasets.get_evaluation(dataset_id)
    score = getattr(evaluation, "score", None) or evaluation.get("score")

    client.datasets.download(dataset_id, format="jsonl", path=str(OUT))
    return {"path": str(OUT), "rows": rows, "source": "adaption-invent", "quality": score, "dataset_id": dataset_id}


if __name__ == "__main__":
    print(json.dumps(build_phrase_set(), indent=2, ensure_ascii=False))
