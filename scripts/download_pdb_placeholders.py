#!/usr/bin/env python3
"""Download placeholder .bcif structures from RCSB for the Mol* viewer.

These are real Ser-His-Asp hydrolase crystal structures used as
template references until Engine B produces de novo designs on GPU.
The Mol* viewer renders them identically to de novo outputs.

Mapping:
  enzyme-001.bcif <- 6EQE (IsPETase, 0.92 Å, Ser160-Asp206-His237)
  enzyme-002.bcif <- 7SH6 (FAST-PETase)
  enzyme-003.bcif <- 1TCA (Candida antarctica lipase B, canonical Ser-His-Asp)
"""

import urllib.request
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PDB_DIR = ROOT / "data" / "artifacts" / "v1.0.0" / "pdb"

DOWNLOADS = {
    "enzyme-001.bcif": "6EQE",
    "enzyme-002.bcif": "7SH6",
    "enzyme-003.bcif": "1TCA",
}

RCSB_BCIF_URL = "https://models.rcsb.org/{pdb_id}.bcif"


def main() -> int:
    PDB_DIR.mkdir(parents=True, exist_ok=True)
    ok = 0
    for filename, pdb_id in DOWNLOADS.items():
        dest = PDB_DIR / filename
        if dest.exists():
            print(f"  SKIP  {filename} (already exists, {dest.stat().st_size} bytes)")
            ok += 1
            continue
        url = RCSB_BCIF_URL.format(pdb_id=pdb_id.lower())
        print(f"  GET   {url} -> {filename} ... ", end="", flush=True)
        try:
            urllib.request.urlretrieve(url, dest)
            print(f"OK ({dest.stat().st_size} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL ({e})")
    print(f"\n{ok}/{len(DOWNLOADS)} .bcif files ready in {PDB_DIR.relative_to(ROOT)}")
    return 0 if ok == len(DOWNLOADS) else 1


if __name__ == "__main__":
    raise SystemExit(main())
