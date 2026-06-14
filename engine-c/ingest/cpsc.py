"""CPSC Recalls ETL — real public data, no synthetic rows.

Pulls children's-apparel and textile recalls from the U.S. Consumer Product
Safety Commission RestWebServices Recall API (https://www.saferproducts.gov),
deduplicates, and tags each recall with the regulatory category its hazard maps
to (lead, phthalates, flammability/sleepwear, drawstrings, formaldehyde, PFAS,
cadmium). These recalls are the positive class for the Engine C compliance
classifier: a recalled garment is a real, documented compliance failure.

Run:
    python -m ingest.cpsc            # fetch + save to data/datasets/cpsc_recalls.parquet
    python -m ingest.cpsc --summary  # just print what is already saved
"""

from __future__ import annotations

import argparse
import re
import sys
import time
from pathlib import Path

import pandas as pd
import requests

CPSC_ENDPOINT = "https://www.saferproducts.gov/RestWebServices/Recall"

# Apparel / children-textile search terms. The API matches these against recall
# titles; the union (deduped) is our candidate corpus.
QUERY_TERMS = [
    "children clothing",
    "childrens apparel",
    "infant",
    "toddler",
    "sleepwear",
    "pajamas",
    "nightgown",
    "drawstring",
    "bib",
    "swimwear",
    "girls clothing",
    "boys clothing",
    "baby clothing",
    "loungewear",
    "robe",
]

# Hazard / description regex -> regulatory category. Word-boundary patterns so
# short tokens ("lead", "amine") do not match inside unrelated words ("leading",
# "examine"). The category is the label the classifier learns to predict from a
# garment's fiber + product signals.
HAZARD_RULES: list[tuple[str, str]] = [
    (r"\blead\b", "CPSIA_LEAD_SUBSTRATE"),
    (r"\bcadmium\b", "CPSIA_LEAD_SUBSTRATE"),
    (r"\bphthalate", "CPSIA_PHTHALATES"),
    (r"\bflammab", "CPSIA_FLAMMABILITY_SLEEPWEAR"),
    (r"\bburn(s|ed|ing)?\b", "CPSIA_FLAMMABILITY_SLEEPWEAR"),
    (r"\bsleepwear\b", "CPSIA_FLAMMABILITY_SLEEPWEAR"),
    (r"\bfire\b", "CPSIA_FLAMMABILITY_SLEEPWEAR"),
    (r"\bdrawstring", "CPSIA_DRAWSTRING_1610"),
    (r"\bstrangulation\b", "CPSIA_DRAWSTRING_1610"),
    (r"\bformaldehyde\b", "OEKO_TEX_CLASS_I_FORMALDEHYDE"),
    (r"\bpfas\b", "CA_AB1817_PFAS"),
    (r"\bper-?\s?and\s?poly", "CA_AB1817_PFAS"),
    (r"\bfluorinat", "CA_AB1817_PFAS"),
    (r"\bazo\b", "REACH_ENTRY43_AMINES"),
    (r"\baromatic amine", "REACH_ENTRY43_AMINES"),
]

_COMPILED = [(re.compile(pat), cat) for pat, cat in HAZARD_RULES]


def _categorize(text: str) -> list[str]:
    t = (text or "").lower()
    cats = {cat for rx, cat in _COMPILED if rx.search(t)}
    return sorted(cats)


def _fetch_term(term: str, session: requests.Session, timeout: int = 30) -> list[dict]:
    resp = session.get(
        CPSC_ENDPOINT,
        params={"format": "json", "RecallTitle": term},
        timeout=timeout,
    )
    resp.raise_for_status()
    data = resp.json()
    return data if isinstance(data, list) else []


def _flatten(recall: dict) -> dict:
    products = recall.get("Products") or []
    hazards = recall.get("Hazards") or []
    product_types = "; ".join(
        p.get("Type", "") for p in products if p.get("Type")
    )
    hazard_text = "; ".join(h.get("Name", "") for h in hazards if h.get("Name"))
    desc = recall.get("Description", "") or ""
    title = recall.get("Title", "") or ""
    blob = " ".join([title, desc, hazard_text, product_types])
    return {
        "recall_id": recall.get("RecallID"),
        "recall_number": recall.get("RecallNumber"),
        "recall_date": recall.get("RecallDate"),
        "title": title,
        "description": desc,
        "hazard": hazard_text,
        "product_types": product_types,
        "url": recall.get("URL"),
        "regulatory_categories": _categorize(blob),
    }


def fetch() -> pd.DataFrame:
    session = requests.Session()
    session.headers.update({"User-Agent": "REWEAR-FUSED-EngineC/1.0 (compliance research)"})
    rows: dict[int, dict] = {}
    for term in QUERY_TERMS:
        try:
            recalls = _fetch_term(term, session)
        except requests.RequestException as exc:  # surface, do not silently swallow
            print(f"  ! query '{term}' failed: {exc}", file=sys.stderr)
            continue
        kept = 0
        for r in recalls:
            rid = r.get("RecallID")
            if rid is None or rid in rows:
                continue
            rows[rid] = _flatten(r)
            kept += 1
        print(f"  · '{term}': {len(recalls)} returned, {kept} new (total {len(rows)})")
        time.sleep(0.4)  # be polite to a public gov endpoint
    df = pd.DataFrame(list(rows.values()))
    if not df.empty:
        df["recall_date"] = pd.to_datetime(df["recall_date"], errors="coerce")
        df = df.sort_values("recall_date", ascending=False).reset_index(drop=True)
    return df


def _out_path() -> Path:
    root = Path(__file__).resolve().parents[2]
    out = root / "data" / "datasets"
    out.mkdir(parents=True, exist_ok=True)
    return out / "cpsc_recalls.parquet"


def summarize(df: pd.DataFrame) -> None:
    print(f"\nCPSC recalls corpus: {len(df)} unique recalls")
    if df.empty:
        return
    labeled = df[df["regulatory_categories"].map(len) > 0]
    print(f"  with a mapped regulatory category: {len(labeled)}")
    counts: dict[str, int] = {}
    for cats in df["regulatory_categories"]:
        for c in cats:
            counts[c] = counts.get(c, 0) + 1
    for cat, n in sorted(counts.items(), key=lambda kv: -kv[1]):
        print(f"    {cat:34s} {n}")
    dmin = df["recall_date"].min()
    dmax = df["recall_date"].max()
    print(f"  date range: {dmin} -> {dmax}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--summary", action="store_true", help="summarize the saved corpus only")
    args = ap.parse_args()
    path = _out_path()

    if args.summary:
        if not path.exists():
            print("no saved corpus; run without --summary first", file=sys.stderr)
            return 1
        summarize(pd.read_parquet(path))
        return 0

    print("fetching CPSC recalls (real public API)...")
    df = fetch()
    if df.empty:
        print("no recalls fetched (API unreachable?)", file=sys.stderr)
        return 1
    df.to_parquet(path, index=False)
    print(f"saved {len(df)} recalls -> {path.relative_to(path.parents[2])}")
    summarize(df)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
