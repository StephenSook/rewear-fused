# engine-c — Digital Recyclability Passport (Vinh)

Chemical-compliance classifier + EU Digital Product Passport + data ETL + live endpoint. Full spec in `docs/vinh_handoff.md`. Outputs conform to `data/contract.md`.

**Current state (Stephen's reference impl, ~20% of the spec below):** `ingest/cpsc.py` pulls 631 real CPSC recalls; `classifier/` is 3 deterministic rules + a per-label CatBoost on the recall text with honest CV PR-AUC (no synthetic data); `build.py` emits real Ed25519-signed passports; `api/main.py` serves `GET /classify/{id}` (Classification), `GET /passport/{id}` (DigitalProductPassport), `/healthz`. The bullets below are the full TARGET design for Vinh to own.

- `ingest/` — ETL for REAL public datasets. Wired: CPSC SaferProducts. Roadmap: EU Safety Gate, Toxic-Free Future / Peaslee PFAS, OEKO-TEX negatives. No synthetic data in the judged path.
- `classifier/` — deterministic rule layer (target: 85+ thresholds; 3 wired today) first, then CatBoost classifier-chain + ChemBERTa-2/MolFormer featurization + SHAP. Target PR-AUC >= 0.85 per label (report PR-AUC, not ROC); report the real achieved number.
- `passport/` — W3C VC 2.0 (JSON-LD under UNTP) + GS1 Digital Link + scannable QR, clear/lab-test/divert.
- `api/` — FastAPI on Render, the `GET /classify/{id}` + `GET /passport/{id}` + `/healthz` routes, keepalive cron. Serves the SAME frozen model that produced `data/artifacts/v1.0.0` (manifest SHA verified).

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e .
pytest -q
```
