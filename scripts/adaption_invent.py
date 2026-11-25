"""Generate Tubora's multilingual painter color phrase set with Adaption Invent.

Run once on the builder's machine (never on Vercel, never at runtime):

    pip install adaption
    ADAPTION_API_KEY=... python scripts/adaption_invent.py
    npm run seed

What `build_phrase_set` does:
  * with ADAPTION_API_KEY:
      1. Adaption() client (reads ADAPTION_API_KEY from the environment)
      2. datasets.invent(..., estimate=True): print the credit estimate, stop if credits are short
      3. datasets.invent(...): the real run, then wait_for_completion (fallback: poll datasets.get)
      4. datasets.get_evaluation: keep status and quality.score_before / score_after /
         improvement_percent
      5. datasets.download(format="jsonl") (fallback: get_export_links)
      6. validate every row, map it to PainterPhrase and write
         fixtures/phrases.sample.json (Adaption rows a0001... followed by the 18 seed rows)
         and fixtures/adaption-evaluation.sample.json, plus data/painter-phrases.jsonl for
         the Hugging Face dataset.
  * without a key: touches nothing and says so.

Docs the calls follow (read them before the paid run):
  https://docs.adaptionlabs.ai/adaptive-data/invent-a-dataset/
  https://docs.adaptionlabs.ai/adaptive-data-quickstart/
  https://docs.adaptionlabs.ai/adaptive-data/evaluate-dataset-quality/
Every keyword or field that could not be checked against those pages carries
"# UNVERIFIED: check docs before the paid run".
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
SAMPLE = ROOT / "fixtures" / "phrases.sample.json"
EVALUATION = ROOT / "fixtures" / "adaption-evaluation.sample.json"
JSONL = ROOT / "data" / "painter-phrases.jsonl"

LANGS = {"en", "tr", "es"}
VALUES = {"dark", "mid", "light"}
CHROMAS = {"muted", "moderate", "vivid"}
HUES = {
    "red", "red-brown", "orange", "yellow-orange", "yellow", "grey-green", "green",
    "blue", "blue-violet", "violet-blue", "violet", "neutral",
}
HEX = re.compile(r"^#?([0-9a-fA-F]{6})$")

# The row schema lives inside the prompt: the documented invent call takes a prompt, not a schema.
PROMPT = (
    "Build an instruction dataset of about 600 phrases a painter would use to describe one "
    "specific color they want to mix, taken from landscapes, portraits and still life. "
    "Write each phrase in English, Turkish or Spanish, roughly a third each. "
    "Include these two rows exactly: 'evening shadow on snow' (en) and "
    "'karın üstünde akşam gölgesi' (tr). "
    "Every row is one JSON object with exactly these keys: "
    "text (the phrase), "
    "lang (one of en, tr, es), "
    "hex (the target color as an sRGB hex like #8084b8), "
    "hue (one of red, red-brown, orange, yellow-orange, yellow, grey-green, green, blue, "
    "blue-violet, violet-blue, violet, neutral), "
    "value (one of dark, mid, light), "
    "chroma (one of muted, moderate, vivid). "
    "No other keys, no commentary."
)


def field(obj: Any, key: str) -> Any:
    """Read a response field from an SDK object or a dict without assuming either."""
    if obj is None:
        return None
    if isinstance(obj, dict):
        return obj.get(key)
    return getattr(obj, key, None)


def as_float(v: Any) -> float | None:
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None


def to_row(raw: Any) -> dict | None:
    """One generated record to the PainterPhrase shape (without id), or None if it fails validation."""
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except json.JSONDecodeError:
            return None
    if not isinstance(raw, dict):
        return None
    # Instruction datasets may wrap the record in a completion/output field.
    for wrapper in ("completion", "output", "response"):  # UNVERIFIED: check docs before the paid run
        inner = raw.get(wrapper)
        if isinstance(inner, str) and inner.strip().startswith("{"):
            try:
                raw = json.loads(inner)
                break
            except json.JSONDecodeError:
                return None
    text = str(raw.get("text") or "").strip()
    lang = str(raw.get("lang") or "").strip().lower()
    hue = str(raw.get("hue") or "").strip().lower()
    value = str(raw.get("value") or "").strip().lower()
    chroma = str(raw.get("chroma") or "").strip().lower()
    m = HEX.match(str(raw.get("hex") or "").strip())
    if not text or lang not in LANGS or not m or hue not in HUES or value not in VALUES or chroma not in CHROMAS:
        return None
    h = m.group(1)
    rgb = [int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)]
    return {"text": text, "lang": lang, "rgb": rgb, "hue": hue, "value": value, "chroma": chroma}


def read_jsonl_text(text: str) -> list[Any]:
    out: list[Any] = []
    for line in text.splitlines():
        line = line.strip()
        if line:
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                out.append(None)
    return out


def download_rows(client: Any, dataset_id: str) -> list[Any]:
    """datasets.download as JSONL, falling back to get_export_links."""
    try:
        res = client.datasets.download(dataset_id, format="jsonl")
        if isinstance(res, (bytes, bytearray)):
            return read_jsonl_text(res.decode("utf-8"))
        if isinstance(res, str):
            p = Path(res)
            return read_jsonl_text(p.read_text(encoding="utf-8") if p.exists() else res)
        if isinstance(res, list):
            return res
        content = field(res, "content") or field(res, "text")  # UNVERIFIED: check docs before the paid run
        if isinstance(content, (bytes, bytearray)):
            return read_jsonl_text(content.decode("utf-8"))
        if isinstance(content, str):
            return read_jsonl_text(content)
    except Exception as e:  # noqa: BLE001
        print(f"download() did not return rows ({e}), trying get_export_links", file=sys.stderr)

    links = client.datasets.get_export_links(dataset_id)  # UNVERIFIED: check docs before the paid run
    url = field(links, "jsonl") or field(links, "url")  # UNVERIFIED: check docs before the paid run
    if not url and isinstance(links, list) and links:
        url = field(links[0], "url")  # UNVERIFIED: check docs before the paid run
    if not url:
        raise RuntimeError(f"no JSONL export link in {links!r}")
    with urllib.request.urlopen(url, timeout=120) as r:  # noqa: S310 (https link from the SDK)
        return read_jsonl_text(r.read().decode("utf-8"))


def wait_done(client: Any, dataset_id: str) -> None:
    """wait_for_completion, falling back to polling datasets.get."""
    try:
        client.datasets.wait_for_completion(dataset_id, timeout=3600)
        return
    except AttributeError:
        pass
    deadline = time.time() + 3600
    while time.time() < deadline:
        ds = client.datasets.get(dataset_id)
        state = str(field(ds, "status") or "").lower()
        if state in ("completed", "succeeded", "ready", "done"):
            return
        if state in ("failed", "error", "cancelled"):
            raise RuntimeError(f"Adaption invent failed: {ds!r}")
        time.sleep(15)
    raise TimeoutError(f"dataset {dataset_id} not ready after an hour")


def seed_rows() -> list[dict]:
    rows = json.loads(SAMPLE.read_text(encoding="utf-8"))
    return [r for r in rows if r.get("source") == "seed-sample"]


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def build_phrase_set() -> dict:
    if not os.environ.get("ADAPTION_API_KEY"):
        print("No ADAPTION_API_KEY: nothing done, fixtures left untouched.", file=sys.stderr)
        return {"ran": False, "reason": "no ADAPTION_API_KEY"}

    from adaption import Adaption  # imported here so the keyless path needs no install

    client = Adaption()  # reads ADAPTION_API_KEY

    # 1. Estimate first, stop before spending if the account is short.
    est = client.datasets.invent(dataset_prompt=PROMPT, training_type="instruction_dataset", estimate=True)
    needed = as_float(field(est, "estimated_credits") or field(est, "credits"))  # UNVERIFIED: check docs before the paid run
    available = as_float(field(est, "available_credits"))  # UNVERIFIED: check docs before the paid run
    print(f"Adaption estimate: {needed} credits needed, {available} available ({est!r})", file=sys.stderr)
    if needed is not None and available is not None and available < needed:
        print(f"Not enough Adaption credits: {available} available, {needed} needed. Nothing done.", file=sys.stderr)
        sys.exit(1)

    # 2. The real run.
    job = client.datasets.invent(dataset_prompt=PROMPT, training_type="instruction_dataset")
    dataset_id = field(job, "dataset_id") or field(job, "id")  # UNVERIFIED: check docs before the paid run
    if not dataset_id:
        raise RuntimeError(f"invent() returned no dataset id: {job!r}")
    dataset_id = str(dataset_id)
    print(f"Adaption dataset {dataset_id} started", file=sys.stderr)
    wait_done(client, dataset_id)

    # 3. Evaluation.
    ev = client.datasets.get_evaluation(dataset_id)
    q = field(ev, "quality")
    quality = None
    if q is not None:
        before = as_float(field(q, "score_before"))
        after = as_float(field(q, "score_after"))
        pct = as_float(field(q, "improvement_percent"))
        if before is not None and after is not None and pct is not None:
            quality = {"score_before": before, "score_after": after, "improvement_percent": pct}
    status = str(field(ev, "status") or ("completed" if quality else "pending"))

    # 4. Rows.
    raw_rows = download_rows(client, dataset_id)
    generated: list[dict] = []
    dropped = 0
    seen: set[tuple[str, str]] = set()
    for raw in raw_rows:
        row = to_row(raw)
        if row is None or (row["lang"], row["text"].lower()) in seen:
            dropped += 1
            continue
        seen.add((row["lang"], row["text"].lower()))
        generated.append(row)

    score_after = quality["score_after"] if quality else None
    adaption_rows = [
        {
            "id": f"a{i + 1:04d}",
            **row,
            "source": "adaption-invent",
            "quality": score_after,
        }
        for i, row in enumerate(generated)
    ]

    # 5. Fixtures: Adaption rows, then the 18 seed rows unchanged, sorted by id like scripts/seed.mjs.
    all_rows = adaption_rows + seed_rows()
    all_rows.sort(key=lambda r: r["id"])
    write_json(SAMPLE, all_rows)
    write_json(
        EVALUATION,
        {
            "status": status,
            "quality": quality,
            "datasetId": dataset_id,
            "rows": len(adaption_rows),
            "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        },
    )
    JSONL.parent.mkdir(parents=True, exist_ok=True)
    with JSONL.open("w", encoding="utf-8") as f:
        for r in adaption_rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(
        f"Wrote {len(adaption_rows)} Adaption rows ({dropped} dropped by validation) to "
        f"{SAMPLE.relative_to(ROOT)}; evaluation {status}. Next: npm run seed",
        file=sys.stderr,
    )
    return {"ran": True, "datasetId": dataset_id, "rows": len(adaption_rows), "dropped": dropped, "status": status, "quality": quality}


if __name__ == "__main__":
    print(json.dumps(build_phrase_set(), indent=2, ensure_ascii=False))
