# backend: Engines A + B (Pravin)

The molecular-design pipelines for Engine A (fiber screening) and Engine B (enzyme redesign). These run on a rented GPU (RunPod), **off this repo**; their pre-computed, signed outputs are committed under `data/artifacts/v1.0.0/` (conforming to `data/contract.md`), and the frontend reads those directly, so the live demo never waits on a GPU. The full pipeline spec is in the private handoff doc.

- **Engine A**: RDKit enumeration over aliphatic isocyanates + soft diols + chain extenders, scored with PU-elastomer property surrogates, filtered to the 25-35 wt% hard-segment window with the cleavable bond in the amorphous soft segment. Constraint-guided screening, not generative design.
- **Engine B**: a LigandMPNN redesign of a serine-hydrolase scaffold (refold + PLACER preorganization + FoldSeek novelty), anchored on the published UMG-SP2 Ser-His-Asp transition-state geometry. In-silico, TRL 2; the de-novo RFdiffusion2 fold is the deferred GPU swing. `scripts/swap_denovo_enzyme.py` swaps a real de-novo result into the frozen contract when it lands, and refuses any FoldSeek TM >= 0.5 to keep the de-novo claim honest.

All outputs are in-silico, TRL 2-3, labeled as such, never fabricated.

```bash
# the artifacts are pre-computed; to re-sign the bundle after a swap:
python scripts/build_manifest.py
python scripts/validate_artifacts.py --strict
```
