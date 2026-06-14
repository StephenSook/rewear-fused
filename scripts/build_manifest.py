#!/usr/bin/env python3
"""Re-sign the FULL data/artifacts/<version> bundle: a real SHA-256 per file.

PRESERVES the existing manifest's modelVersions + issuer, so it never downgrades
the Engine C provenance to 'placeholder' or drops the signer DID — it is the
freeze-gate full-bundle signer once every lane's artifacts are present, safe to
run any time. (Engine C's own build.py writes the manifest for its files; this
re-signs everything, including future Engine A/B fibers/enzymes/pdb.)

generatedAt is preserved (or a stable placeholder) so the committed manifest does
not churn; the real freeze re-stamps it. SHAs are real and anchor frozen-model parity.
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path


def _produced_by(rel: str) -> str:
    if rel.startswith(("compliance/", "passports/")):
        return "engine-c"
    if rel.startswith("garments"):
        return "input"
    if rel.startswith(("fibers/", "pairs/")):
        return "engine-a"
    if rel.startswith(("enzymes/", "pdb/")):
        return "engine-b"
    return "pipeline"


def build(version: str = "v1.0.0") -> None:
    root = Path(__file__).resolve().parents[1]
    base = root / "data" / "artifacts" / version
    mpath = base / "manifest.json"
    existing = json.loads(mpath.read_text()) if mpath.exists() else {}
    prev_pb = {f.get("path"): f.get("producedBy") for f in existing.get("files", [])}

    files = []
    for p in sorted(base.rglob("*")):
        if p.is_file() and p.name != "manifest.json":
            rel = str(p.relative_to(base))
            files.append({
                "path": rel,
                "sha256": hashlib.sha256(p.read_bytes()).hexdigest(),
                "bytes": p.stat().st_size,
                "producedBy": prev_pb.get(rel) or _produced_by(rel),
            })

    manifest = {
        "version": version.lstrip("v"),
        "generatedAt": existing.get("generatedAt", "2026-06-14T20:00:00Z"),
        "files": files,
        "modelVersions": existing.get("modelVersions", {"engineC": "unknown"}),
    }
    if existing.get("issuer"):
        manifest["issuer"] = existing["issuer"]
    mpath.write_text(json.dumps(manifest, indent=2) + "\n")
    print(
        f"re-signed {len(files)} files "
        f"(modelVersions={manifest['modelVersions']}, issuer preserved={'issuer' in manifest})"
    )


if __name__ == "__main__":
    build(*sys.argv[1:])
