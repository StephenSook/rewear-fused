#!/usr/bin/env python3
"""Hot-swap a de-novo enzyme design into the frozen artifact bundle.

This is the ONE-COMMAND upgrade path from LigandMPNN-redesign to de-novo:
  python scripts/swap_denovo_enzyme.py \
    --bcif /path/to/denovo.bcif \
    --slot enzyme-001 \
    --tm 0.38 \
    --preorg 0.72 \
    --plddt 89.5 \
    --plddt-as 94.1 \
    --ca-rmsd 0.45 \
    --sc-rmsd 1.28

What it does:
  1. Copies the .bcif into data/artifacts/v1.0.0/pdb/<slot>.bcif
  2. Updates enzymes/designs.json — swaps noveltyVerdict to de-novo,
     updates PLACER metrics and FoldSeek TM from real pipeline output
  3. Re-signs the manifest (preserving Engine C provenance)
  4. Runs --strict validation
  5. Prints a git-commit-ready summary

If FoldSeek TM < 0.5, the de-novo claim is valid.
If TM >= 0.5, refuses the swap (you'd be overclaiming).

Requirements: Python 3.12+, no pip dependencies.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "data" / "artifacts" / "v1.0.0"
DESIGNS = ART / "enzymes" / "designs.json"


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Hot-swap a de-novo enzyme .bcif into the artifact bundle"
    )
    ap.add_argument("--bcif", required=True, type=Path, help="Path to the de-novo .bcif file")
    ap.add_argument("--slot", required=True, choices=["enzyme-001", "enzyme-002", "enzyme-003"],
                     help="Which enzyme slot to replace")
    ap.add_argument("--tm", required=True, type=float, help="FoldSeek best TM-score (must be < 0.5 for de-novo claim)")
    ap.add_argument("--preorg", required=True, type=float, help="PLACER preorganizationFraction")
    ap.add_argument("--plddt", required=True, type=float, help="Protein pLDDT (whole chain)")
    ap.add_argument("--plddt-as", required=True, type=float, help="Active-site pLDDT")
    ap.add_argument("--ca-rmsd", required=True, type=float, help="Catalytic-Ca RMSD (A)")
    ap.add_argument("--sc-rmsd", required=True, type=float, help="Self-consistency RMSD (A)")
    ap.add_argument("--uncertainty", type=float, default=0.04, help="PLACER uncertainty")
    ap.add_argument("--best-hit", type=str, default=None, help="FoldSeek best hit PDB ID (or None)")
    ap.add_argument("--force", action="store_true", help="Allow TM >= 0.5 (label as partial-redesign)")
    args = ap.parse_args()

    # --- Gate: TM must be < 0.5 for de-novo claim ---
    if args.tm >= 0.5 and not args.force:
        print(f"REFUSED: FoldSeek TM {args.tm:.2f} >= 0.5 — not a de-novo fold.", file=sys.stderr)
        print("The noveltyVerdict would be dishonest. Use --force to override (labels as partial-redesign).", file=sys.stderr)
        return 1

    # --- Validate .bcif exists ---
    if not args.bcif.exists():
        print(f"REFUSED: .bcif file not found: {args.bcif}", file=sys.stderr)
        return 1

    bcif_dest = ART / "pdb" / f"{args.slot}.bcif"

    # --- 1. Copy .bcif ---
    print(f"  COPY  {args.bcif} → {bcif_dest.relative_to(ROOT)}")
    shutil.copy2(args.bcif, bcif_dest)

    # --- 2. Update designs.json ---
    designs = json.loads(DESIGNS.read_text())
    updated = False
    for d in designs:
        if d["id"] == args.slot:
            d["foldseekBestTM"] = args.tm
            d["foldseekBestHitPdb"] = args.best_hit
            d["placer"] = {
                "preorganizationFraction": args.preorg,
                "plddt": args.plddt,
                "plddtActiveSite": args.plddt_as,
                "catalyticCaRmsd": args.ca_rmsd,
                "scRmsd": args.sc_rmsd,
                "uncertainty": args.uncertainty,
            }
            if args.tm < 0.5:
                d["noveltyVerdict"] = (
                    f"de-novo: RFdiffusion2 + LigandMPNN backbone with no close structural match "
                    f"in PDB (FoldSeek TM {args.tm:.2f} < 0.5). Ser-His-Asp triad anchored on "
                    f"UMG-SP2 transition-state geometry."
                )
            else:
                d["noveltyVerdict"] = (
                    f"partial-redesign: FoldSeek TM {args.tm:.2f} to {args.best_hit or 'template'} "
                    f"(>= 0.5, does not qualify as de-novo fold)."
                )
            updated = True
            print(f"  SWAP  {args.slot}: TM {args.tm:.2f}, preorg {args.preorg:.2f}, "
                  f"verdict={'de-novo' if args.tm < 0.5 else 'partial-redesign'}")
            break

    if not updated:
        print(f"REFUSED: slot '{args.slot}' not found in designs.json", file=sys.stderr)
        return 1

    DESIGNS.write_text(json.dumps(designs, indent=2) + "\n")

    # --- 3. Re-sign manifest ---
    print("  SIGN  re-signing manifest...")
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "build_manifest.py")],
        cwd=str(ROOT), capture_output=True, text=True
    )
    print(f"        {result.stdout.strip()}")

    # --- 4. Validate --strict ---
    print("  GATE  running --strict validation...")
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "validate_artifacts.py"), "--strict"],
        cwd=str(ROOT), capture_output=True, text=True
    )
    print(f"        {result.stdout.strip()}")
    if result.returncode != 0:
        print(f"\nFAILED: --strict returned errors:\n{result.stdout}", file=sys.stderr)
        return 1

    # --- 5. Summary ---
    bcif_sha = hashlib.sha256(bcif_dest.read_bytes()).hexdigest()[:12]
    print(f"\n{'='*60}")
    print(f"SUCCESS: {args.slot} upgraded to {'de-novo' if args.tm < 0.5 else 'partial-redesign'}")
    print(f"  .bcif SHA: {bcif_sha}...")
    print(f"  TM-score:  {args.tm:.2f} ({'< 0.5 ✓ de-novo claim valid' if args.tm < 0.5 else '>= 0.5, partial'})")
    print(f"  PLACER:    preorg {args.preorg:.2f} ± {args.uncertainty}")
    print(f"  pLDDT:     {args.plddt:.1f} (active-site {args.plddt_as:.1f})")
    print(f"  RMSD:      Cα {args.ca_rmsd:.2f} Å, sc {args.sc_rmsd:.2f} Å")
    print(f"\nNext steps:")
    print(f"  git add data/artifacts/v1.0.0/")
    print(f"  git commit -m \"feat(engine-b): de-novo {args.slot} (TM {args.tm:.2f}, FoldSeek < 0.5)\"")
    print(f"  git push origin pravin")
    print(f"  # Stephen: merge + Vercel redeploy")
    print(f"{'='*60}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
