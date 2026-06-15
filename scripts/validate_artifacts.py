#!/usr/bin/env python3
"""Validate the data/artifacts/v1.0.0 bundle against data/contract.md.

The contract is the single anti-drift surface between Stephen (frontend),
Vinh (Engine C) and Pravin (Engine A/B). This script enforces the shapes AND the
locked scientific constraints (CLAUDE.md §2) at the data layer, so a non-conformant
artifact is caught here — in CI — instead of silently breaking the frontend at the
June-15 freeze gate.

Modes:
  python scripts/validate_artifacts.py            # pre-freeze: Engine A/B optional, placeholders warn
  python scripts/validate_artifacts.py --strict   # freeze gate: all files required, NO placeholders

Checks: required fields + types; inSilico/trl on every object; aliphatic isocyanate
(Constraint 1) + aromaticAmineRelease NONE; Ser-His-Asp triad + pH 7.0-8.5
(Constraint 2); hard-segment 25-35 wt% (Constraint 3); pair cross-references
(Rule 4); decision/status/jurisdiction enums; manifest SHA-256 parity.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "data" / "artifacts" / "v1.0.0"

ARCHETYPES = {"onesie", "legging", "sleeper", "bodysuit", "swim"}
JURISDICTIONS = {"US-Federal", "US-CA", "US-NY", "US-ME", "EU"}
DECISIONS = {"clear", "lab-test", "divert"}
STATUSES = {"PASS", "FLAG", "FAIL"}
MEASURED = {"deterministic", "predicted"}

errors: list[str] = []
warnings: list[str] = []


def err(where: str, msg: str) -> None:
    errors.append(f"{where}: {msg}")


def warn(where: str, msg: str) -> None:
    warnings.append(f"{where}: {msg}")


def load(rel: str):
    """Load a JSON artifact; tolerate garments.json at the root OR under garments/."""
    candidates = [ART / rel]
    if rel == "garments/garments.json":
        candidates = [ART / "garments.json", ART / "garments/garments.json"]
    for p in candidates:
        if p.exists():
            try:
                return json.loads(p.read_text())
            except json.JSONDecodeError as e:
                err(rel, f"invalid JSON: {e}")
                return None
    return None


def is_num(x) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def in_unit(x) -> bool:
    return is_num(x) and 0.0 <= x <= 1.0


def need(obj: dict, fields: list[str], where: str) -> None:
    for f in fields:
        if f not in obj:
            err(where, f"missing required field '{f}'")


def check_insilico(obj: dict, where: str) -> None:
    if obj.get("inSilico") is not True and "trl" not in obj:
        err(where, "must carry inSilico: true (or a trl)")


def check_placeholder(obj: dict, where: str, strict: bool) -> None:
    if obj.get("placeholder") is True:
        (err if strict else warn)(where, "carries placeholder:true (must be removed by the freeze gate)")


# --- per-artifact validators -------------------------------------------------

def v_garments(strict: bool) -> set[str]:
    data = load("garments/garments.json")
    ids: set[str] = set()
    if data is None:
        err("garments", "missing (required)")
        return ids
    for i, g in enumerate(data):
        w = f"garments[{i}]"
        need(g, ["id", "name", "archetype", "imageUrl", "fiberComposition"], w)
        check_insilico(g, w)
        if g.get("archetype") not in ARCHETYPES:
            err(w, f"archetype '{g.get('archetype')}' not in {sorted(ARCHETYPES)}")
        for c in g.get("fiberComposition", []):
            if not all(k in c for k in ("fiber", "percent", "source")):
                err(w, "fiberComposition entry needs fiber/percent/source")
        ids.add(g.get("id"))
    return ids


def v_regulations() -> set[str]:
    data = load("compliance/regulations.json")
    ids: set[str] = set()
    if data is None:
        err("regulations", "missing (required)")
        return ids
    for i, r in enumerate(data):
        w = f"regulations[{i}]"
        need(r, ["id", "name", "jurisdiction", "limit", "citation", "effectiveDate"], w)
        if r.get("jurisdiction") not in JURISDICTIONS:
            err(w, f"jurisdiction '{r.get('jurisdiction')}' not in {sorted(JURISDICTIONS)}")
        ids.add(r.get("id"))
    return ids


def v_classification(c: dict, where: str, reg_ids: set[str], strict: bool) -> None:
    need(c, ["garmentId", "decision", "probability", "prAuc", "auc", "triggeredRegulations"], where)
    check_insilico(c, where)
    check_placeholder(c, where, strict)
    if c.get("decision") not in DECISIONS:
        err(where, f"decision '{c.get('decision')}' not in {sorted(DECISIONS)}")
    for k in ("probability", "prAuc", "auc"):
        if k in c and not in_unit(c[k]):
            err(where, f"{k} must be a number in 0..1 (got {c.get(k)!r})")
    for j, t in enumerate(c.get("triggeredRegulations", [])):
        tw = f"{where}.triggeredRegulations[{j}]"
        need(t, ["regulationId", "status", "measuredOrPredicted", "detail"], tw)
        if t.get("status") not in STATUSES:
            err(tw, f"status '{t.get('status')}' not in {sorted(STATUSES)}")
        if t.get("measuredOrPredicted") not in MEASURED:
            err(tw, f"measuredOrPredicted '{t.get('measuredOrPredicted')}' not in {sorted(MEASURED)}")
        if reg_ids and t.get("regulationId") not in reg_ids:
            warn(tw, f"regulationId '{t.get('regulationId')}' not in regulations catalog")
    for j, s in enumerate(c.get("compositionDrivers") or []):
        if not (isinstance(s, dict) and isinstance(s.get("feature"), str) and is_num(s.get("weight"))):
            err(where, f"compositionDrivers[{j}] must be {{feature: str, weight: number}}")


def v_classifications(reg_ids: set[str], garment_ids: set[str], strict: bool) -> None:
    data = load("compliance/classifications.json")
    if data is None:
        err("classifications", "missing (required)")
        return
    for i, c in enumerate(data):
        v_classification(c, f"classifications[{i}]", reg_ids, strict)
        if garment_ids and c.get("garmentId") not in garment_ids:
            err(f"classifications[{i}]", f"garmentId '{c.get('garmentId')}' has no garment")


def v_passports(reg_ids: set[str], garment_ids: set[str], strict: bool) -> None:
    pdir = ART / "passports"
    files = sorted(pdir.glob("dpp_*.json")) if pdir.exists() else []
    if not files:
        err("passports", "no dpp_*.json passports found (required)")
        return
    for p in files:
        w = f"passports/{p.name}"
        try:
            d = json.loads(p.read_text())
        except json.JSONDecodeError as e:
            err(w, f"invalid JSON: {e}")
            continue
        need(d, ["passportId", "garmentId", "gs1DigitalLinkUri", "qrPayload",
                 "classification", "aromaticAmineRelease", "credential", "trl"], w)
        check_insilico(d, w)
        check_placeholder(d, w, strict)
        if not str(d.get("gs1DigitalLinkUri", "")).startswith("https://id.gs1.org/01/"):
            err(w, "gs1DigitalLinkUri must be a GS1 Digital Link (https://id.gs1.org/01/...)")
        # Constraint 1: aliphatic design -> no aromatic amine release
        if d.get("aromaticAmineRelease") != "NONE":
            err(w, "aromaticAmineRelease must be 'NONE' (Constraint 1, aliphatic design)")
        cred = d.get("credential", {})
        if "proof" not in cred or not cred.get("proof", {}).get("signatureValue"):
            err(w, "credential.proof.signatureValue missing (passport must be signed)")
        if d.get("trl") != "TRL 2-3":
            err(w, f"trl must be 'TRL 2-3' (got {d.get('trl')!r})")
        if isinstance(d.get("classification"), dict):
            v_classification(d["classification"], f"{w}.classification", reg_ids, strict)
            if garment_ids and d["classification"].get("garmentId") not in garment_ids:
                err(w, "embedded classification.garmentId has no garment")


def v_fibers(strict: bool) -> set[str]:
    data = load("fibers/candidates.json")
    ids: set[str] = set()
    if data is None:
        (err if strict else warn)("fibers/candidates", "not yet produced (Engine A, Pravin)")
        return ids
    for i, f in enumerate(data):
        w = f"fibers/candidates[{i}]"
        need(f, ["id", "isocyanate", "softSegment", "chainExtender", "hardSegmentWtPct",
                 "predicted", "accessibilityScore", "carbamateSmarts"], w)
        check_insilico(f, w)
        check_placeholder(f, w, strict)
        iso = f.get("isocyanate", {})
        if iso.get("type") != "aliphatic":
            err(w, f"isocyanate.type must be 'aliphatic' (Constraint 1; got {iso.get('type')!r})")
        hs = f.get("hardSegmentWtPct")
        if is_num(hs) and not (25 <= hs <= 35):
            err(w, f"hardSegmentWtPct must be 25..35 (Constraint 3; got {hs})")
        if not in_unit(f.get("accessibilityScore", -1)):
            err(w, "accessibilityScore must be 0..1")
        ids.add(f.get("id"))
    return ids


def v_screening(strict: bool) -> None:
    data = load("fibers/screening.json")
    if data is None:
        (err if strict else warn)("fibers/screening", "not yet produced (Engine A, Pravin)")
        return
    if not isinstance(data, dict):
        err("fibers/screening", "must be a single Screening object")
        return
    need(data, ["enumeratedCount", "scoredCount", "filteredCount", "topCandidateIds"], "fibers/screening")
    for k in ("enumeratedCount", "scoredCount", "filteredCount"):
        if k in data and not (isinstance(data[k], int) and not isinstance(data[k], bool)):
            err("fibers/screening", f"{k} must be an integer")
    if "topCandidateIds" in data and not isinstance(data["topCandidateIds"], list):
        err("fibers/screening", "topCandidateIds must be a list")


def v_tradeoff(strict: bool) -> None:
    data = load("fibers/tradeoffCurve.json")
    if data is None:
        (err if strict else warn)("fibers/tradeoffCurve", "not yet produced (Engine A, Pravin)")
        return
    need(data, ["x", "degradability", "mechanicalRetention", "designWindow", "citationNote"], "fibers/tradeoffCurve")
    if data.get("designWindow") != [25, 35]:
        err("fibers/tradeoffCurve", f"designWindow must be [25, 35] (Constraint 3; got {data.get('designWindow')})")
    xs = data.get("x")
    for name in ("degradability", "mechanicalRetention"):
        arr = data.get(name)
        if isinstance(xs, list) and isinstance(arr, list) and len(arr) != len(xs):
            err("fibers/tradeoffCurve", f"{name} length {len(arr)} != x length {len(xs)}")
        if isinstance(arr, list) and not all(in_unit(v) for v in arr):
            err("fibers/tradeoffCurve", f"{name} values must be 0..1")


def v_enzymes(strict: bool) -> set[str]:
    data = load("enzymes/designs.json")
    ids: set[str] = set()
    if data is None:
        (err if strict else warn)("enzymes/designs", "not yet produced (Engine B, Pravin — needs GPU)")
        return ids
    for i, e in enumerate(data):
        w = f"enzymes/designs[{i}]"
        need(e, ["id", "matchedFiberId", "catalyticTriad", "pHOptimum", "placer",
                 "foldseekBestTM", "noveltyVerdict", "pdbPath"], w)
        check_insilico(e, w)
        check_placeholder(e, w, strict)
        if e.get("catalyticTriad") != "Ser-His-Asp":
            err(w, f"catalyticTriad must be 'Ser-His-Asp' (Constraint 2; got {e.get('catalyticTriad')!r})")
        ph = e.get("pHOptimum")
        if not (isinstance(ph, list) and len(ph) == 2 and all(is_num(x) and 7.0 <= x <= 8.5 for x in ph)):
            err(w, f"pHOptimum must be two values within 7.0..8.5 (Constraint 2; got {ph})")
        pdb = e.get("pdbPath")
        if pdb and not (ART / pdb).exists():
            err(w, f"pdbPath '{pdb}' does not resolve to a file (Mol* would fail on stage)")
        ids.add(e.get("id"))
    return ids


def v_pairs(fiber_ids: set[str], enzyme_ids: set[str], strict: bool) -> None:
    data = load("pairs/topPairs.json")
    if data is None:
        (err if strict else warn)("pairs/topPairs", "not yet produced (Pravin)")
        return
    for i, p in enumerate(data):
        w = f"pairs/topPairs[{i}]"
        need(p, ["fiberId", "enzymeId", "enzyme_match", "substrateSmiles", "narrative"], w)
        # Rule 4: cross-references must resolve
        if fiber_ids and p.get("fiberId") not in fiber_ids:
            err(w, f"fiberId '{p.get('fiberId')}' not in fibers/candidates")
        if enzyme_ids and p.get("enzymeId") not in enzyme_ids:
            err(w, f"enzymeId '{p.get('enzymeId')}' not in enzymes/designs")


def v_manifest() -> None:
    data = load("manifest.json")
    if data is None:
        err("manifest", "missing (required)")
        return
    need(data, ["version", "generatedAt", "files", "modelVersions"], "manifest")
    if data.get("version") != "1.0.0":
        warn("manifest", f"version is {data.get('version')!r}, expected '1.0.0'")
    for entry in data.get("files", []):
        rel = entry.get("path")
        f = ART / rel if rel else None
        if not f or not f.exists():
            err("manifest", f"references missing file '{rel}'")
            continue
        actual = hashlib.sha256(f.read_bytes()).hexdigest()
        if entry.get("sha256") != actual:
            err("manifest", f"SHA-256 mismatch for '{rel}' (manifest stale — rebuild)")
    # reverse coverage: every present artifact must be signed by the manifest, so a
    # file can't be swapped/added without the SHA gate ever running on it
    listed = {entry.get("path") for entry in data.get("files", [])}
    for p in ART.rglob("*"):
        if p.is_file() and p.name != "manifest.json":
            rel = p.relative_to(ART).as_posix()  # forward slashes: match manifest paths on Windows + Linux
            if rel not in listed:
                err("manifest", f"present artifact '{rel}' is not covered by the manifest files[] (unsigned)")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--strict", action="store_true", help="freeze-gate mode: all files required, no placeholders")
    args = ap.parse_args()

    if not ART.exists():
        print(f"FAIL: artifact dir not found: {ART}", file=sys.stderr)
        return 2

    garment_ids = v_garments(args.strict)
    reg_ids = v_regulations()
    v_classifications(reg_ids, garment_ids, args.strict)
    v_passports(reg_ids, garment_ids, args.strict)
    fiber_ids = v_fibers(args.strict)
    v_screening(args.strict)
    v_tradeoff(args.strict)
    enzyme_ids = v_enzymes(args.strict)
    v_pairs(fiber_ids, enzyme_ids, args.strict)
    v_manifest()

    mode = "STRICT (freeze gate)" if args.strict else "pre-freeze"
    print(f"Artifact validation — {mode} — {ART.relative_to(ROOT)}")
    for wn in warnings:
        print(f"  WARN  {wn}")
    for e in errors:
        print(f"  FAIL  {e}")
    if errors:
        print(f"\n{len(errors)} error(s), {len(warnings)} warning(s) — NON-CONFORMANT")
        return 1
    print(f"\nconformant ({len(warnings)} warning(s))")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
