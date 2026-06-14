"""REWEAR-FUSED Engine C live endpoint (Vinh).

Serves the signed, pre-computed Digital Recyclability Passport artifacts. The
deployed service must serve the EXACT frozen model/version that produced
data/artifacts/v1.0.0 (frozen-model parity); at the artifact-freeze gate, Vinh
swaps the static artifacts for the real classifier outputs of the same shape.
This file does not invent numbers; it returns what the artifact bundle holds.
"""

from __future__ import annotations

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
    return {
        "status": "ok",
        "service": "engine-c",
        "version": "1.0.0",
        "artifacts_present": (ARTIFACTS / "garments.json").exists(),
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
