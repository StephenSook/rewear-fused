"""Frozen-model parity gate (spec §6.4): the endpoint must serve ONLY the byte-exact
frozen outputs, and must refuse to boot if the served artifacts have drifted from the
manifest. These tests pin both the pass and the refuse-to-boot path."""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

from api import main as A

ENGINE_C = Path(__file__).resolve().parents[1]
REAL_ARTIFACTS = Path(__file__).resolve().parents[2] / "data" / "artifacts" / "v1.0.0"


def _stage(tmp_path: Path) -> Path:
    """Copy the real frozen bundle into a temp dir we can tamper with safely."""
    dst = tmp_path / "v1.0.0"
    shutil.copytree(REAL_ARTIFACTS, dst)
    return dst


def test_manifest_has_frozen_parity_anchor():
    manifest = json.loads((REAL_ARTIFACTS / "manifest.json").read_text())
    anchor = manifest.get("frozenParity")
    assert anchor and anchor["path"] == "compliance/classifications.json"
    # the anchor SHA must equal the actual served file (no stale manifest)
    served = (REAL_ARTIFACTS / anchor["path"]).read_bytes()
    assert anchor["sha256"] == hashlib.sha256(served).hexdigest()


def test_verify_passes_on_frozen_bundle(monkeypatch, tmp_path):
    monkeypatch.setattr(A, "ARTIFACTS", _stage(tmp_path))
    sha = A._verify_frozen_parity()
    assert len(sha) == 64  # a real SHA-256, not a stub


def test_verify_refuses_on_tampered_classifications(monkeypatch, tmp_path):
    staged = _stage(tmp_path)
    monkeypatch.setattr(A, "ARTIFACTS", staged)
    # flip one byte of the served output: the parity gate must reject the boot
    target = staged / "compliance" / "classifications.json"
    data = json.loads(target.read_text())
    data[0]["probability"] = 0.123456  # a number the frozen model never produced
    target.write_text(json.dumps(data, indent=2))
    with pytest.raises(A.FrozenModelMismatch):
        A._verify_frozen_parity()


def test_verify_refuses_when_manifest_absent(monkeypatch, tmp_path):
    staged = _stage(tmp_path)
    monkeypatch.setattr(A, "ARTIFACTS", staged)
    (staged / "manifest.json").unlink()
    with pytest.raises(A.FrozenModelMismatch):
        A._verify_frozen_parity()


def test_verify_refuses_on_drifted_passport(monkeypatch, tmp_path):
    # not just classifications: every manifest file[] entry is gated, so a drifted
    # passport (which embeds a signed VC) must also refuse the boot.
    staged = _stage(tmp_path)
    monkeypatch.setattr(A, "ARTIFACTS", staged)
    p = staged / "passports" / "dpp_carters-legging-blend.json"
    d = json.loads(p.read_text())
    d["trl"] = "TRL 9"  # a claim the frozen passport never made
    p.write_text(json.dumps(d, indent=2))
    with pytest.raises(A.FrozenModelMismatch):
        A._verify_frozen_parity()


def test_import_refuses_to_boot_on_tampered_bundle(tmp_path):
    """The behavior Render actually depends on: importing api.main against a tampered
    bundle must exit NON-ZERO so uvicorn never binds and the deploy is marked failed.
    Exercised in a subprocess because the gate runs at import time (once per process)."""
    staged = _stage(tmp_path)
    target = staged / "compliance" / "classifications.json"
    data = json.loads(target.read_text())
    data[0]["probability"] = 0.123456
    target.write_text(json.dumps(data, indent=2))

    env = {**os.environ, "ARTIFACTS_DIR": str(staged), "PYTHONUTF8": "1"}
    proc = subprocess.run(
        [sys.executable, "-c", "import api.main"],
        cwd=str(ENGINE_C), env=env, capture_output=True, text=True,
    )
    assert proc.returncode != 0, "import must fail on a tampered bundle (else Render boots a bad deploy)"
    assert "FrozenModelMismatch" in proc.stderr
