# backend — Engines A + B (Pravin)

Molecular pipelines and the FastAPI artifact server. Full spec in `docs/pravin_handoff.md`. Outputs conform to `data/contract.md`.

- `engine_a/` — RDKit enumeration + property surrogates (constraint-guided screening, aliphatic only, 25-35 wt% hard, cleavable bond in the amorphous soft segment).
- `engine_b/` — RFdiffusion2/3 to LigandMPNN to Boltz-2 to PLACER to FoldSeek (MIT/CC-BY only; no AlphaFold3/ESM3/Chai-2). Theozyme anchored on the UMG-SP2 Ser-His-Asp transition-state geometry.
- `api/` — serves the signed artifact bundle.
- `scripts/` — GPU pre-flight smoke (run once before June 14).

Artifact-freeze gate: June 15 EOD. Real pipeline outputs only, TRL 2-3 labeled, never fabricated.

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e .
pytest -q
```
