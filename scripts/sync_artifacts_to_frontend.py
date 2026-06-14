#!/usr/bin/env python3
"""Snapshot the signed Engine C artifact bundle into the frontend so the build
imports the REAL classifier outputs (no placeholders). Re-run after every
`python -m classifier.build`. The frontend reads these statically (demo-safe,
no live dependency); the live endpoint serves the byte-identical bundle.

Usage: python scripts/sync_artifacts_to_frontend.py
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "data" / "artifacts" / "v1.0.0"
DST = ROOT / "frontend" / "src" / "lib" / "artifacts"


def main() -> int:
    DST.mkdir(parents=True, exist_ok=True)

    def copy(rel_src: str, name: str) -> None:
        obj = json.loads((SRC / rel_src).read_text())
        (DST / name).write_text(json.dumps(obj, indent=2) + "\n")
        print(f"  {name:22s} <- {rel_src}")

    copy("garments.json", "garments.json")
    copy("compliance/regulations.json", "regulations.json")
    copy("compliance/classifications.json", "classifications.json")

    passports = sorted(
        (json.loads(p.read_text()) for p in (SRC / "passports").glob("dpp_*.json")),
        key=lambda d: d["garmentId"],
    )
    (DST / "passports.json").write_text(json.dumps(passports, indent=2) + "\n")
    print(f"  passports.json         <- {len(passports)} passports")

    manifest = json.loads((SRC / "manifest.json").read_text())
    (DST / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"  manifest.json          <- model {manifest.get('modelVersions')}")
    print(f"synced real artifacts -> {DST.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
