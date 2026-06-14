"""Tests for the real Engine C classifier: deterministic rules, built artifacts,
and the trained model. No placeholders, no synthetic data."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from classifier import rules as R

ARTIFACTS = Path(__file__).resolve().parents[2] / "data" / "artifacts" / "v1.0.0"


def _garments() -> dict[str, dict]:
    return {g["id"]: g for g in json.loads((ARTIFACTS / "garments.json").read_text())}


def test_deterministic_rules_match_composition():
    g = _garments()
    # mono cotton bodysuit: ESPR recyclable PASS, aliphatic amine PASS
    flags = {f["regulationId"]: f for f in R.deterministic_flags(g["carters-bodysuit-cotton"])}
    assert flags["EU_ESPR_DPP"]["status"] == "PASS"
    assert flags["REACH_ENTRY43_AMINES"]["status"] == "PASS"

    # 5% elastane legging: ESPR FLAG (blend not recyclable today)
    flags = {f["regulationId"]: f for f in R.deterministic_flags(g["carters-legging-blend"])}
    assert flags["EU_ESPR_DPP"]["status"] == "FLAG"
    assert flags["EU_ESPR_DPP"]["measuredOrPredicted"] == "deterministic"

    # 18% elastane + UPF rashguard: ESPR FAIL + PFAS FLAG
    flags = {f["regulationId"]: f for f in R.deterministic_flags(g["carters-rashguard-swim"])}
    assert flags["EU_ESPR_DPP"]["status"] == "FAIL"
    assert flags["CA_AB1817_PFAS"]["status"] == "FLAG"


def test_built_classifications_are_real():
    data = json.loads((ARTIFACTS / "compliance" / "classifications.json").read_text())
    assert len(data) >= 3
    decisions = {c["garmentId"]: c for c in data}
    assert decisions["carters-bodysuit-cotton"]["decision"] == "clear"
    assert decisions["carters-legging-blend"]["decision"] == "lab-test"
    assert decisions["carters-rashguard-swim"]["decision"] == "divert"
    for c in data:
        assert "placeholder" not in c, "real artifacts must carry no placeholder flag"
        assert 0.0 < c["probability"] <= 1.0
        assert 0.0 < c["prAuc"] <= 1.0
        assert c["inSilico"] is True


def test_passport_is_signed_and_conformant():
    p = json.loads((ARTIFACTS / "passports" / "dpp_carters-legging-blend.json").read_text())
    assert p["gs1DigitalLinkUri"].startswith("https://id.gs1.org/01/")
    assert p["aromaticAmineRelease"] == "NONE"
    assert p["credential"]["proof"]["signatureValue"]
    assert p["classification"]["garmentId"] == "carters-legging-blend"


@pytest.mark.slow
def test_model_trains_with_real_pr_auc():
    from classifier import model as M

    cm = M.train()
    assert "CPSIA_FLAMMABILITY_SLEEPWEAR" in cm.labels
    # flammability is strongly predictable from product type; real, well above base rate
    assert cm.pr_auc("CPSIA_FLAMMABILITY_SLEEPWEAR") > 0.7
    # lead is rare and hard from a description alone: PR-AUC stays modest (honest)
    assert cm.pr_auc("CPSIA_LEAD_SUBSTRATE") < 0.8
