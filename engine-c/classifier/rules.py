"""Deterministic regulatory rule layer — authoritative, zero ML, zero fabrication.

Per the Engine C spec (hybrid neuro-symbolic): the rules run FIRST and decide
compliance whenever the fiber composition is enough to do so. The ML risk model
only colours the residual, uncertain categories (lead, phthalates) that a
description cannot settle. Decision routing is clear / lab-test / divert.

Every flag carries the real statute citation from the repo's regulations.json.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path


@lru_cache(maxsize=1)
def _regs() -> dict[str, dict]:
    p = Path(__file__).resolve().parents[2] / "data" / "artifacts" / "v1.0.0" / "compliance" / "regulations.json"
    return {r["id"]: r for r in json.loads(p.read_text())}


def _fiber_pct(garment: dict, *names: str) -> float:
    want = {n.lower() for n in names}
    return sum(
        c["percent"] for c in garment.get("fiberComposition", [])
        if any(w in c["fiber"].lower() for w in want)
    )


def features(garment: dict) -> dict:
    """Real, composition-derived features. No synthetic chemical history is used
    as a signal; simulatedChemicalHistory stays a human note only."""
    elastane = _fiber_pct(garment, "elastane", "spandex", "lycra")
    synthetic = _fiber_pct(garment, "polyester", "nylon", "polyamide", "acrylic")
    cotton = _fiber_pct(garment, "cotton")
    arch = garment.get("archetype", "")
    components = garment.get("fiberComposition", [])
    return {
        "elastane_pct": elastane,
        "synthetic_pct": synthetic,
        "cotton_pct": cotton,
        "mono_material": len(components) == 1,
        "archetype": arch,
        "is_sleepwear": arch in {"sleeper", "pajama"},
        "likely_dwr": arch in {"swim"} or "rashguard" in garment.get("name", "").lower()
        or "upf" in garment.get("name", "").lower(),
    }


def garment_text(garment: dict) -> str:
    """The pseudo-description the ML model scores, built only from real fields."""
    comp = " ".join(f"{c['percent']}% {c['fiber']}" for c in garment.get("fiberComposition", []))
    return f"{garment.get('name','')}. {garment.get('archetype','')}. {comp}.".lower()


def deterministic_flags(garment: dict) -> list[dict]:
    """Hard regulatory facts decidable from composition alone."""
    f = features(garment)
    regs = _regs()
    flags: list[dict] = []

    def cite(reg_id: str) -> str:
        r = regs.get(reg_id, {})
        return f"{r.get('citation', reg_id)} ({r.get('limit', '')})".strip()

    # ESPR fiber-to-fiber recyclability: elastane is the wall REWEAR-FUSED exists to break.
    if "EU_ESPR_DPP" in regs:
        if f["elastane_pct"] >= 15:
            flags.append({"regulationId": "EU_ESPR_DPP", "status": "FAIL", "measuredOrPredicted": "deterministic",
                          "detail": f"{f['elastane_pct']:.0f}% elastane blocks fiber-to-fiber recycling today; {cite('EU_ESPR_DPP')}"})
        elif f["elastane_pct"] > 0:
            flags.append({"regulationId": "EU_ESPR_DPP", "status": "FLAG", "measuredOrPredicted": "deterministic",
                          "detail": f"{f['elastane_pct']:.0f}% elastane blend not yet fiber-to-fiber recyclable; {cite('EU_ESPR_DPP')}"})
        else:
            flags.append({"regulationId": "EU_ESPR_DPP", "status": "PASS", "measuredOrPredicted": "deterministic",
                          "detail": f"mono/cellulosic composition is fiber-to-fiber recyclable; {cite('EU_ESPR_DPP')}"})

    # PFAS: a water-repellent/UPF finish is the classic intentional-PFAS vector.
    if "CA_AB1817_PFAS" in regs and f["likely_dwr"]:
        flags.append({"regulationId": "CA_AB1817_PFAS", "status": "FLAG", "measuredOrPredicted": "deterministic",
                      "detail": f"water-repellent/UPF finish: total-organic-fluorine screen required under {cite('CA_AB1817_PFAS')}"})

    # Aromatic amines: REWEAR-FUSED's designed fiber is aliphatic by construction (Constraint 1).
    if "REACH_ENTRY43_AMINES" in regs:
        flags.append({"regulationId": "REACH_ENTRY43_AMINES", "status": "PASS", "measuredOrPredicted": "deterministic",
                      "detail": f"aliphatic isocyanate design: no MDA/TDA pathway; {cite('REACH_ENTRY43_AMINES')}"})

    return flags


# ML-residual categories: rare chemical violations a description cannot settle,
# so they are routed to lab-test rather than asserted. Mapped from the model's labels.
ML_CATEGORY_REG = {
    "CPSIA_FLAMMABILITY_SLEEPWEAR": "CPSIA_FLAMMABILITY_SLEEPWEAR",
    "CPSIA_LEAD_SUBSTRATE": "CPSIA_LEAD_SUBSTRATE",
    "CPSIA_DRAWSTRING_1610": "CPSIA_DRAWSTRING_1610",
}

# A model risk above this routes the category to lab-test (predicted, not asserted).
ML_FLAG_THRESHOLD = 0.5
