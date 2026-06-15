"""REWEAR-FUSED Engine C live endpoint (Vinh).

Serves the signed, pre-computed Digital Recyclability Passport artifacts. The
deployed service must serve the EXACT frozen model/version that produced
data/artifacts/v1.0.0 (frozen-model parity); at the artifact-freeze gate, Vinh
swaps the static artifacts for the real classifier outputs of the same shape.
This file does not invent numbers; it returns what the artifact bundle holds.
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

ARTIFACTS = Path(
    os.environ.get(
        "ARTIFACTS_DIR",
        str(Path(__file__).resolve().parents[2] / "data" / "artifacts" / "v1.0.0"),
    )
)


class FrozenModelMismatch(RuntimeError):
    """Raised on startup when the served artifacts are not byte-identical to the
    frozen outputs recorded in the manifest. We refuse to boot rather than serve
    numbers that did not come from the frozen model (spec §6.4 parity)."""


def _hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _verify_frozen_parity() -> str:
    """Frozen-model parity gate (spec §6.4). The manifest records a SHA-256 per
    artifact the frozen model produced; on startup we hash every file we are about
    to serve and refuse to start on any mismatch. This is OUTPUT parity — it proves
    the served decisions/probabilities/passports are byte-identical to the frozen,
    signed bundle — chosen over model-binary parity because .cbm bytes are not
    reproducible across the build/Render Python split.

    Scope (be honest about it): this is tamper-EVIDENT against drift, corruption,
    and a wrong/partial deploy — the failures that actually happen. It is NOT a
    cryptographic authenticity check: the manifest lives in the same bundle, so a
    coordinated rebuild that regenerates a matching manifest would pass. The real
    authenticity anchor is the Ed25519 signature on each passport. Returns the
    verified anchor SHA for /healthz.
    """
    manifest_path = ARTIFACTS / "manifest.json"
    if not manifest_path.exists():
        raise FrozenModelMismatch(
            f"manifest.json absent at {manifest_path}; cannot prove frozen-model parity"
        )
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    # The frozenParity anchor is the must-exist canary (the classifications the demo
    # serves); the manifest files[] is the full bundle we additionally pin.
    anchor = manifest.get("frozenParity")
    if not anchor or "path" not in anchor or "sha256" not in anchor:
        raise FrozenModelMismatch("manifest.json has no frozenParity anchor (rebuild via classifier.build)")

    # Verify EVERY signed artifact, not just the anchor, so a drifted passport or
    # garments file can't be served unverified alongside a clean classifications.json.
    for entry in manifest.get("files", []):
        rel, want = entry.get("path"), entry.get("sha256")
        served = ARTIFACTS / rel if rel else None
        if not served or not served.exists():
            raise FrozenModelMismatch(f"frozen artifact {rel!r} is missing; refusing to serve an incomplete bundle")
        got = _hash(served)
        if got != want:
            raise FrozenModelMismatch(
                f"{rel} SHA-256 mismatch: served {got} != frozen {want}. The served bundle is NOT the "
                "frozen model's output — refusing to boot. (If this only happens on Linux/Render, suspect "
                "CRLF→LF: the frozen SHA is over LF bytes; check .gitattributes covers data/artifacts/**.)"
            )

    # Re-confirm the anchor specifically (catches a manifest whose files[] omits it).
    anchor_file = ARTIFACTS / anchor["path"]
    if not anchor_file.exists() or _hash(anchor_file) != anchor["sha256"]:
        raise FrozenModelMismatch(f"frozenParity anchor {anchor['path']} failed verification")
    return anchor["sha256"]


# Run the gate at import time so an unverifiable deploy fails fast: uvicorn never
# binds the port and Render's health check never goes green on a tampered bundle.
FROZEN_PARITY_SHA = _verify_frozen_parity()

app = FastAPI(title="REWEAR-FUSED Engine C", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


def _load(rel: str):
    p = ARTIFACTS / rel
    if not p.exists():
        return None
    return json.loads(p.read_text())


@app.get("/healthz")
def healthz() -> dict:
    # The startup gate already proved parity (a mismatch raises at import and uvicorn
    # never binds), but we re-hash the anchor live on each ping so the keepalive cron
    # surfaces a TRUE check, not a hardcoded flag — and would catch post-boot drift.
    # Field is named output_sha_ok, not model_sha_ok: we verify the served OUTPUT
    # bytes, not a model binary (frozenParity.kind == "output").
    anchor = ARTIFACTS / "compliance" / "classifications.json"
    output_sha_ok = anchor.exists() and _hash(anchor) == FROZEN_PARITY_SHA
    return {
        "status": "ok",
        "service": "engine-c",
        "version": "1.0.0",
        "artifacts_present": (ARTIFACTS / "garments.json").exists(),
        "parity_kind": "output",
        "output_sha_ok": output_sha_ok,
        "frozen_parity_sha": FROZEN_PARITY_SHA,
    }


@app.get("/garments")
def garments():
    data = _load("garments.json")
    if data is None:
        raise HTTPException(status_code=503, detail="artifact bundle not loaded")
    return data


@app.get("/regulations")
def regulations():
    data = _load("compliance/regulations.json")
    if data is None:
        raise HTTPException(status_code=503, detail="artifact bundle not loaded")
    return data


@app.get("/classify/{garment_id}")
def classify(garment_id: str):
    data = _load("compliance/classifications.json") or []
    for c in data:
        if c.get("garmentId") == garment_id:
            return c
    raise HTTPException(status_code=404, detail="no classification for that garment")


@app.get("/passport/{garment_id}")
def passport(garment_id: str):
    data = _load(f"passports/dpp_{garment_id}.json")
    if data is None:
        raise HTTPException(status_code=404, detail="no passport for that garment")
    return data
