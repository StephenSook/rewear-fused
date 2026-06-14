# Backend Handoff: Pravin (Engines A + B, molecular pipelines)

> Owner: Pravin. Consumers: the frontend (Stephen) and the pitch.
> This doc tells you exactly what to build, in what order, with which tools/versions/licenses, and what artifacts you must emit so the frontend renders without ever touching a GPU on stage.
> Source of truth for output shapes: `data/contract.md`. Source of truth for science constraints: `CLAUDE.md` §2 and §14. This handoff never overrides either; where it adds detail it cites the source PDF.
>
> **Honesty gate (applies to you too):** every number you ship is a real pipeline output or a clearly-marked placeholder (`"placeholder": true`). Do not invent kinetics, pLDDT, RMSD, or version numbers. Where the source research did not specify a value, this doc says "not specified in sources" and you must do the same in the artifacts. Fabricated outputs dressed as real are the single worst outcome (see CLAUDE.md Demo Evidence Rule).

---

## 0. Your lane in one paragraph

You own the two molecular pipelines. **Engine A** screens a designed cleavable elastane fiber (constraint-guided virtual screening, not generative design). **Engine B** designs the matched de novo carbamate hydrolase that cleaves Engine A's fiber. You produce pre-computed, signed JSON + `.bcif` artifacts under `data/artifacts/v1.0.0/`, conforming field-for-field to `data/contract.md`. You also stand up the FastAPI artifact server, but the demo runs off static files; the server is a convenience, not a dependency. The frontend builds against mock fixtures from hour zero and swaps to your real artifacts at the **artifact-freeze gate (June 15 EOD)**.

You do NOT run a GPU job live during the demo. Pre-compute the top 3 matched fiber-enzyme pairs so the pitch cannot break on stage.

---

## 1. Engine B: De Novo Carbamate Hydrolase (the grand-prize moment)

### 1.1 Exact tool order, versions, licenses

Run this pipeline in order. All tools are MIT / Apache / CC-BY. **Avoid AlphaFold3 (DeepMind non-commercial), ESM3 (commercial restrictions), and Chai-2 (proprietary, early-access only).** This is a licensing gate for the project's commercial intent, not a preference (Backend No Limits PDF, "Licensing-safe stack" + Caveat 5).

| Step | Tool | Role | License | Source notes |
|---|---|---|---|---|
| 1. Theozyme | UMG-SP2 transition-state geometry (Polêto/Paiva QM/MM) | Anchor active-site geometry as an atom-level constraint set | n/a (geometry, not code) | See 1.2 |
| 2. Backbone | **RFdiffusion2** (default) | Theozyme-anchored backbone generation, atom-level active-site scaffolding | MIT, `github.com/RosettaCommons/RFdiffusion2` | Solved 41/41 enzyme-design benchmarks vs 16 prior best (Ahern/Yim et al., Nat. Methods 2026, DOI 10.1038/s41592-025-02975-x) |
| 2b. Backbone (stretch) | **RFdiffusion3** | Use only if you need ligand/substrate co-generation; 168M params, ~10x faster than RFd2, open-sourced Dec 3 2025 | MIT | Butcher/Krishna et al., bioRxiv 10.1101/2025.09.18.676967. See fallback in §5. RFd3's experimental validation is thin; RFd2 is the safe default |
| 3. Sequence | **LigandMPNN** (default) | Catalysis-aware inverse folding over the active site | MIT/Apache | Dauparas et al., Nat. Methods 2025, DOI 10.1038/s41592-025-02626-1 |
| 3b. Sequence (stretch) | **EnhancedMPNN** (ResiDPO-tuned LigandMPNN) | ~3x enzyme in-silico success (6.56% -> 17.57%) at same ~55% recovery | MIT/Apache | Xue et al., arXiv 2506.00297. Stretch only; LigandMPNN is the proven Lauko-recipe default |
| 4. Cheap filter | **ESMFold** | Fast refold to drop sequences whose predicted structure diverges from the design before paying for Boltz-2 | MIT | Used as the cheap triage filter (CLAUDE.md §14). Do not confuse with ESM3 (banned) |
| 5. Structure + affinity | **Boltz-2** | Joint structure + binding-affinity oracle; ~20 s/GPU, ~1000x faster than FEP | MIT | Passaro et al., bioRxiv 10.1101/2025.06.14.659707. **Treat as a fast ranker, not a ground-truth FEP replacement** (Backend No Limits Caveat 1) |
| 6. Catalytic geometry | **PLACER** | Active-site preorganization ensemble validation | MIT, `github.com/baker-laboratory/PLACER` | Anishchenko/Kipnis/Kalvet et al., PNAS 2025, DOI 10.1073/pnas.2427161122. **PLACER scores geometry, it does not compute activation energies** (Caveat 3) |
| 7. Novelty | **FoldSeek** | Structural-novelty check; require TM-score < 0.5 to UMG-SP2 and the SP1/SP2/SP3 cluster | GPL-3 / MIT (binaries) | Backs the Flag-1 "de novo fold" badge |

Optional ceiling additions (NOT required for the demo, do not block on them): Boltz-ABFE / OpenFE for absolute binding free energy on the top ~100 designs; MACE-OFF24 MLIP-MD + GROMACS-CP2K QM/MM umbrella sampling for activation energy. These produce stronger numbers but are not consumed by any contract field. Skip unless Phase B finishes early.

### 1.2 The theozyme: anchor on geometry, do not copy the protein

The whole novelty argument is: **anchor on the UMG-SP2 transition-state geometry, but design a brand-new fold that contains a Ser-His-Asp triad.**

- The wild-type UMG-SP2 catalytic triad is **Ser190-Ser166cis-Lys91** (an amidase-signature Ser-cisSer-Lys triad), not Ser-His-Asp (Molecular Asset PDF, Caveat 1; structure PDB 8WDW, 2.59 A apo).
- That wild-type lysine mechanism is **most active at pH ~10**, which damages the cotton/wool we want to co-recover (Constraint 2; Branson 2023; alkaline-pH requirement confirmed in the UMG-SP2 QM/MM work).
- Therefore you re-anchor: take the QM/MM-optimized **transition-state coordinates** (the reaction-coordinate geometry, the oxyanion hole ~2.8 A N-H...O=C backbone amides, the nucleophile-base-acid spacing) and submit THAT as the atom-level constraint to RFdiffusion2. You design a **Ser-His-Asp** triad (the canonical near-neutral serine-hydrolase triad, as in lipases/cutinases/PETases) onto a novel scaffold. This is a designed re-anchoring, not a literal copy of UMG-SP2 (Molecular Asset Caveat 1 is explicit about this: you must justify it as designed, not claim it is the wild-type triad).

**QM/MM activation-energy barrier, a flagged discrepancy you must resolve before quoting it.** The three source PDFs (Backend No Limits, Polymer Chemistry, Wet-Lab) all cite the rate-limiting Gibbs activation energy as **20.8 kcal/mol** (Polêto/Paiva et al., RSC Chem. Sci. 2025, DOI 10.1039/D4SC06688J). However `CLAUDE.md` §15 "Verified Corrections" states the value is **21.2 kcal/mol** (attributing it to Świderek 2025, JACS, DOI 10.1021/jacs.5c13147). These are two different papers. **Do not silently pick one.** If this number appears anywhere in your artifacts or captions, use the CLAUDE.md §15 corrected value (21.2 kcal/mol, Świderek) because CLAUDE.md is the project's locked source-of-truth and §15 explicitly overrides, and add a note to `PLAN.md` so Stephen and the pitch copy stay consistent. Better: this barrier is a property of the wild-type enzyme, not of your design, so you likely do not need to surface it in a contract field at all.

### 1.3 Anchor structures to download (CC0, frozen)

Pre-fetch as `.bcif` from RCSB at build time (Molecular Asset PDF, "exact download list"). Never hit a live API during the demo. Primary anchor and the Ser-His-Asp templates:

- **UMG-SP2 anchor:** `8WDW` (apo + PMS-bound + BBC-bound), `9FZW` (2nd deposit). Fallback anchor if 8WDW active-site resolution is insufficient: **`9FVF` (UMG-SP3)**, which has a product-bound state (Molecular Asset, "Thresholds that would change strategy").
- **Ser-His-Asp α/β-hydrolase templates to recombine (do not copy):** `6EQE` (IsPETase, 0.92 A; Ser160-Asp206-His237), `7SH6` (FAST-PETase), `6THS` (LCC-ICCG), `1TCA` (CalB lipase, canonical Ser-His-Asp), `4OYY` (HiC cutinase).
- Family context: `8S7Z` (UMG-SP1), `6C6G` (AtzE), `5H6S` (hydrazidase), `8ES6` (ClbL), `3A2P` (NylA), `6QZ4` (MHETase).

UMG-SP2 sequence for feeding RFdiffusion / LigandMPNN / Boltz-2: GenBank accession **OP972510** (Branson et al.).

### 1.4 Headline credibility metrics (the Lauko thresholds)

These map directly to `enzymes/designs.json` -> `placer{}`. Report each with uncertainty. The thresholds below are the Lauko et al. (Science 2025) acceptance criteria carried in CLAUDE.md §14 and VIEW 4:

| Contract field | Metric | Lauko / CLAUDE threshold | Notes |
|---|---|---|---|
| `placer.preorganizationFraction` | PLACER preorganization fraction | the headline number; higher = better | Run PLACER as a multi-model ensemble (CLAUDE.md §14 calls for a ~50-model ensemble); the fraction is over the ensemble |
| `placer.plddt` | protein pLDDT | **> 80** | whole-chain confidence |
| `placer.plddtActiveSite` | active-site pLDDT | **> 90** | |
| `placer.catalyticCaRmsd` | catalytic-Ca RMSD | **< 1.0 A** | design vs theozyme geometry |
| `placer.scRmsd` | full-chain self-consistency RMSD | **< 2.0 A** | refold-vs-design agreement |
| `placer.uncertainty` | +/- band on `preorganizationFraction` | required | from the ensemble spread |
| `foldseekBestTM` | FoldSeek best TM-score | **< 0.5** for the de novo claim | < 0.5 to UMG-SP2 = novel fold (Flag 1) |

**Do NOT quote kcat/Km for your designed urethanase as if measured.** The Lauko 2.2x10^5 M^-1s^-1 figure is for serine **ester** hydrolysis, not carbamate/urethane hydrolysis; urethane cleavage is harder and current best urethanases are far slower on real PU (Wet-Lab PDF, Caveat 1). Everything you ship is in-silico (`inSilico: true`). There is no contract field for a predicted kcat/Km, so do not invent one.

---

## 2. Engine A: Cleavable Fiber Design (constraint-guided screening, NOT generative)

### 2.1 The enumeration

Build the candidate space in **RDKit** (2026.03.2 stable) by combinatorial enumeration of PSMILES repeat units. This is "tractable virtual screening," not "billion-scale generative design" (Polymer Chemistry PDF 1e). The locked building blocks:

- **Aliphatic isocyanates ONLY (Constraint 1):** HDI (PubChem CID 13242), IPDI (CID 17394), H12MDI (CID 16156). Never aromatic (MDI/TDI): aromatic isocyanates cleave to MDA/TDA, IARC-listed carcinogens, a dead pitch for infant skin. Contract enforces `isocyanate.type: "aliphatic"`; an aromatic isocyanate is a contract violation.
- **Soft diols (~2000 g/mol):** PTMG (PSMILES `[*]OCCCC[*]`), PCL-diol (`[*]OC(=O)CCCCC[*]`), polycarbonate diol (HDO-based, `[*]OC(=O)O(CH2)6[*]`). The cleavable ester/carbonate bond lives in the soft, amorphous segment (Constraint 3). PCL and polycarbonate are the enzymatically-cleavable choices; PTMG (polyether) is the resistant baseline for contrast.
- **Chain extenders:** BDO (CID 8064), EDA (CID 3301). EDA restores the urea H-bonding for spandex-class recovery. Optional fallback extenders carrying built-in cleavable points (HEDS disulfide, acetal-BDO) per Polymer Chemistry 1d: treat as backup chemistry, not the primary path.

Realistic enumerated size: ~600 base candidates (3 isocyanates x ~8 soft segments x 5 extenders x 5 hard-segment bins), expanding to ~1,800-4,500 with NCO/OH stoichiometry variants (Polymer Chemistry 1e/9). Encode the carbamate cleavage site as a SMARTS: `[R]-NH-C(=O)-O-[R']` (the contract's `carbamateSmarts` field).

### 2.2 Property surrogates (and their honest limits)

Score each enumerated candidate with an **ensemble** of property predictors. The NeurIPS-2025 lesson is explicit: do not rely on a single polymer model (Backend No Limits, Engine A ceiling).

- **polyBERT** (`kuelumbus/polyBERT`, HuggingFace, 600-D fingerprint): bulk-property baseline.
- **polyBART** (arXiv 2506.04233): bidirectional polymer LM, comparison only.
- **ModernBERT-base**: beat ChemBERTa and polyBERT in the NeurIPS-2025 Open Polymer Prediction Challenge; the recommended ensemble member.
- **Ding-XGBoost** (Ding et al. 2023, Chin. J. Polym. Sci., DOI 10.1007/s10118-022-2838-6) for PU mechanical properties; and the 2025 PU-Tg XGBoost (R^2 > 0.91, RMSE ~9.6 K, DOI 10.1021/acsapm.5c04524) for Tg. PolyID (NREL, DOI 10.1021/acs.macromol.3c00994) is an alternative Tg predictor with a built-in domain-of-validity (DoV) flag.

**Honest applicability limits you MUST encode as confidence and surface in the UI (Constraint 5):**
- polyBERT/polyBART/PolyID are trained predominantly on **homopolymers and random copolymers**, NOT segmented block PU-ureas (polyBERT's own paper says so; Polymer Chemistry 3b). They can ballpark Tg, density, and rough elastomeric class of an effective-average repeat unit; they cannot represent the block architecture that is the physical basis of spandex behavior.
- **Tg** is predictable (PolyID MAE ~19.8-26.4 C; XGBoost RMSE ~9.6 K), adequate to discriminate elastomeric from non-elastomeric.
- **Cyclic fatigue, true elastic recovery, hysteresis, spinnability, and microphase morphology are NOT predicted by any current ML model** (Polymer Chemistry 3d). These require wet-lab validation. Every predicted-property object carries a `confidence` (0..1) and the frontend stamps the persistent "in-silico, wet-lab validation required" badge.

### 2.3 Locked filter constraints

After scoring, filter to the design window (Constraints 1-3):

- Aliphatic isocyanate only.
- Hard-segment content **25-35 wt%** (`hardSegmentWtPct`). Below ~17-20 wt%: insufficient physical crosslinking, degrades/creeps too fast. Above ~40 wt%: leathery/rigid, won't degrade. 25-35 wt% is the validated >400% elongation regime (Polymer Chemistry 2a, Pugar 2022 / Ding 2023).
- **Soft-segment Tg < -50 C** (`tgSoftC`; PCL ~-60 C, PTMG ~-75 C, polycarbonate slightly above PCL but well below 0 C). Note: CLAUDE.md §14 says "soft Tg < -50 C"; the literature reference values are even lower, so the threshold is comfortably met by PCL/polycarbonate.
- **Elongation >= 400%** (`elongationPct`).
- Cleavable bond in the amorphous soft segment (encoded by construction: `carbamateSmarts` lives on the soft block, never the hard domains).

`tgHardC` for the hard segment is reported too (HDI-urea ~80-100 C per Molecular Asset 3c); the contract carries both `tgSoftC` and `tgHardC`.

The funnel counts go to `fibers/screening.json`: `enumeratedCount` -> `scoredCount` -> `filteredCount` -> `topCandidateIds[]`.

### 2.4 The trade-off curve (the honesty centerpiece, VIEW 3)

Emit `fibers/tradeoffCurve.json`: `x` = hard-segment wt%, `degradability[]` (0..1) and `mechanicalRetention[]` (0..1) as two crossing curves, `designWindow: [25, 35]`, and a `citationNote` drawn ONLY from the verified DOI list (Xu SusMat 2026 DOI 10.1002/sus2.70038; Qin Adv. Sci. 2024 DOI 10.1002/advs.202400255). Do not invent the curve values from nothing. Derive the shape from the HS-content-vs-properties literature (monotonic: higher HS -> higher retention, lower degradability) and mark the object `"placeholder": true` until you have model-derived points. The annotation copy is fixed: "<17 wt% = degrades too fast; >40 wt% = won't degrade."

### 2.5 The handoff (proof it is ONE loop)

The top fiber's carbamate microenvironment is emitted as Engine B's substrate target. Concretely: extract the carbamate-bearing soft-segment fragment, generate a 3D conformer (RDKit `AllChem.ETKDGv3()`), and feed its geometry into the Engine B theozyme/docking step. This linkage is what makes `pairs/topPairs.json` real rather than cosmetic: `matchedFiberId` on the enzyme and `fiberId`/`enzymeId` on the pair must cross-reference actual ids (contract rule 4). The substrate SMILES goes in `pairs/topPairs.json -> substrateSmiles`.

---

## 3. Exact artifacts you produce (conform field-for-field to `data/contract.md`)

Write under `data/artifacts/v1.0.0/`. Every file carries `inSilico: true` (or `trl`). Every numeric prediction carries a confidence or interval. `null` is allowed where genuinely not computed (frontend renders "pending"); a fabricated number is never allowed. Early-build placeholders set the numeric field to a plausible mock AND add `"placeholder": true` at the object root; remove ALL placeholders by the freeze gate.

You own these files (Vinh owns garments/compliance/passports):

- **`enzymes/designs.json`**: array of `EnzymeDesign`. Required: `id`, `matchedFiberId`, `catalyticTriad: "Ser-His-Asp"` (always; contract rule 3), `pHOptimum: [7.0, 8.5]` (always in the 7.0-8.5 band; contract rule 3), the full `placer{}` block (§1.4), `foldseekBestTM`, `foldseekBestHitPdb` (string or `null`), `noveltyVerdict` (e.g. "no close structural match in PDB (TM < 0.5)"), `pdbPath` (e.g. `"pdb/enzyme-001.bcif"`), `inSilico: true`.
- **`fibers/candidates.json`**: array of `FiberCandidate`. Required: `id`, `isocyanate{name, type:"aliphatic", pubchemCid}` (always aliphatic; contract rule 2), `softSegment{name, mwGramsPerMol}`, `chainExtender`, `hardSegmentWtPct` (25..35), `predicted{tgSoftC, tgHardC, elongationPct, modulusMPa, confidence}`, `accessibilityScore` (0..1, carbamate enzymatic accessibility), `carbamateSmarts`, `inSilico: true`.
- **`fibers/screening.json`**: one `Screening`: `enumeratedCount`, `scoredCount`, `filteredCount`, `topCandidateIds[]`.
- **`fibers/tradeoffCurve.json`**: one `TradeoffCurve`: `x[]`, `degradability[]`, `mechanicalRetention[]`, `designWindow:[25,35]`, `citationNote`.
- **`pairs/topPairs.json`**: array of `MatchedPair` (3 pairs): `fiberId`, `enzymeId`, `enzyme_match` (linkage label shown on the handoff arrow), `substrateSmiles`, `narrative` (one sentence for the demo). Ids MUST exist in `designs.json` and `candidates.json` (contract rule 4).
- **`pdb/<enzymeId>.bcif`**: one per enzyme design. Binary CIF, Mol*-ready. Pre-convert your RFdiffusion `.pdb` outputs to `.bcif` (~80% smaller, instant Mol* load). Ship 3 placeholder hydrolase PDBs (e.g. a real Ser-His-Asp template like 1TCA/6EQE re-labeled as placeholder) until your real Engine B outputs land, so the frontend's Mol* viewer is never blocked.
- **`manifest.json`**: `version: "1.0.0"`, `generatedAt` (ISO, stamped by your pipeline not the frontend), `files[]` with `{path, sha256, bytes, producedBy}` per file, and `modelVersions` (e.g. `{ "rfdiffusion": "2", "ligandmpnn": "<ver>", "boltz": "2", "polybert": "<ver>" }`). **Compute a real SHA-256 per file.** The manifest is the provenance backbone; the live Engine C endpoint must match its frozen artifact byte-for-byte (contract rule 5), and the same discipline applies to your files.

Provenance hygiene (Molecular Asset PDF Part 6): every downloaded anchor artifact should also record its source DB, accession, DOI, retrieval timestamp, and license, so a judge can click a structure and verify it byte-identical against rcsb.org.

Contract changes require a `⚠️ CONTRACT` commit prefix and a ping to every consumer in `PLAN.md`. Do not add fields the contract does not define.

---

## 4. GPU pre-flight (do this before any GPU spend)

- **Hardware:** RunPod **H100 / H200 / B200**. H200 (141 GB HBM3e, ~$4.39/GPU-hr on RunPod (verify current pricing)) is the price/performance sweet spot for RFdiffusion2 + Boltz-2 inference; B200 (~$4.99-6.03/hr) if you want more headroom (Backend No Limits, hardware section).
- **Budget cap:** ~**$300-500 for the weekend** (CLAUDE.md §14). Boltz-2 is ~$0.001/prediction in ~20 s, so the GPU spend is dominated by RFdiffusion backbone generation and any optional MD, not by affinity scoring. Stay inside the cap; the optional MACE-OFF24 / QM/MM / Boltz-ABFE steps are the expensive part, so skip them unless you have margin.
- **Smoke the FULL pipeline once before you commit GPU budget.** Run the entire Engine B chain (theozyme -> RFdiffusion2 -> LigandMPNN -> ESMFold filter -> Boltz-2 -> PLACER -> FoldSeek) end-to-end on a small batch (e.g. 10-50 designs) and confirm at least a handful pass the PLACER + FoldSeek gates and serialize cleanly to the contract shapes. Backend No Limits Phase-1 recommendation: 10,000 designs -> expect 30-100 to pass; for the demo a far smaller batch is fine, you only need 3 good matched pairs.
- **Pin the working image AND a second install path.** Once the smoke run succeeds, snapshot/pin the exact RunPod container image (tool versions, CUDA, weights). Then write down (and test) a second independent way to stand the stack back up: either a second pinned image, a Docker/Apptainer build from a locked Dockerfile, or a Tamarind-Bio-style hosted fallback for RFdiffusion/MPNN/Boltz. One pinned image is a single point of failure on a 72-hour clock.
- **Never depend on a live API during a judged run.** Pre-fetch every RCSB/PubChem/AlphaFold artifact at build time (rate limits: RCSB <=5 req/s, PubChem <=5 req/s, AlphaFold ~1 req/s).

---

## 5. Fallbacks and the artifact-freeze gate

### Fallbacks (decide fast, do not burn the clock)
- **Theozyme stalls (RFdiffusion can't scaffold the Ser-His-Asp triad cleanly, or nothing passes PLACER):** fall back to a **LigandMPNN redesign of the UMG-SP2 scaffold**. Take the real 8WDW backbone and use LigandMPNN to redesign the active-site sequence toward a Ser-His-Asp / near-neutral-pH triad on the existing fold. You lose the FoldSeek "de novo fold" novelty claim (TM-score will be high to UMG-SP2), so set `foldseekBestTM` honestly and change `noveltyVerdict` to reflect a redesign-not-de-novo result. Honesty beats a fabricated novelty badge.
- **RFdiffusion3 unstable** (its experimental validation is thin: 35/190 cysteine hydrolases, no crystal structures of designed complexes; Backend No Limits Caveat 2): **fall back to RFdiffusion2**, which is the proven Lauko-recipe default anyway. RFd3 is a stretch for ligand co-generation only; do not put it on the critical path.
- **EnhancedMPNN doesn't reproduce:** fall back to plain **LigandMPNN** (the locked default; EnhancedMPNN is a stretch upgrade).
- **Boltz-2 ranking looks unreliable for this substrate class:** Boltz-2 has known high variance by target class (Caveat 1). Use it only to rank, lean harder on PLACER preorganization + FoldSeek novelty for the headline story, and do not over-claim a Boltz affinity number.

### Artifact-freeze gate: **June 15 EOD**
By June 15 EOD, your artifacts under `data/artifacts/v1.0.0/` must be final, real, and placeholder-free, so the frontend can swap mocks for real outputs with zero shape changes (CLAUDE.md three-lane ownership). After the freeze: no field changes without a `⚠️ CONTRACT` commit and a `PLAN.md` ping to all consumers. Lock the top 3 matched pairs and their `.bcif` files first; they are the demo. If a real Engine B design is not ready by the gate, ship the best honest result you have (a LigandMPNN redesign per the fallback) rather than a fabricated de novo design. A redesign labeled honestly is a real artifact; an invented one is the APEX loss condition.

---

## 6. Wet-lab roadmap (one section, for the Cox residency pitch)

You will not run any wet lab in 72 hours. This section exists so the pitch can answer "did you actually make any of this?" with a credible, costed validation path (Wet-Lab PDF). Everything you ship is TRL 2-3, in-silico; the wet-lab plan is the bridge to TRL 4+.

- **The keystone experiment (de-risks all three engines at once):** express ONE lead designed urethanase in E. coli (pET-28a / BL21(DE3), Twist NGS-verified clonal gene, ~$150-400/construct, IMAC + SEC purify) -> confirm activity on a colorimetric/fluorometric carbamate surrogate (p-nitrophenyl carbamate at 405-410 nm, or a 4MU fluorogenic substrate, the Lauko primary-screen format) -> demonstrate dose-dependent **monomer release** (diamine/diol) from a small coupon of the matched designed fiber by HPLC/LC-MS, against an enzyme-free negative control. This single "design -> expressed enzyme -> cleaves designed material -> releases monomers" chain is the matched-pair proof.
- **Specificity matrix:** a 2x2 of {designed enzyme, no-enzyme} x {designed cleavable fiber, conventional spandex}. The designed enzyme should release stoichiometric monomer from the designed fiber and far less from conventional PU; the designed fiber should resist a non-matched control enzyme.
- **Why it is cheap and screenable:** Lauko et al. (Science 2025) found de novo serine hydrolases in screens of as few as ~20 designs at ~10% hit rates; cell-free TXTL (PURExpress / myTXTL) produces protein in ~2 days vs ~3 weeks in vivo, so triage designs cell-free first, then express only confirmed leads. First colorimetric assay: ~1 week, ~$1-3K.
- **Budget / timeline:** Phase 0 (now-3 mo, ~$5-15K): provisional patent + recruit academic PI + NSF Project Pitch. Phase 1 (mo 3-12, ~$150-350K, NSF/DOE STTR Phase I up to ~$305K): express + assay leads, synthesize + characterize fiber, run the matched-pair MVP. Phase 2 (mo 12-36, ~$1-2M, SBIR/STTR Phase II): enzyme engineering, fiber scale-up + wet spinning, closed-loop bench pilot.
- **Partners / facilities:** Baker Lab / IPD (UW) for de novo enzymes; Bornscheuer & Wei (Greifswald), Weidong Liu (Tianjin/CAS), Westh & Morth (DTU) for PU-degrading enzymes; NC State Wilson College of Textiles / Clemson / Georgia Tech for fiber spinning; NREL-led DOE **BOTTLE** consortium ("recyclable by design") via CRADA for the framing.
- **IP / FTO:** a de novo enzyme is human-made and patentable as a composition of matter (35 U.S.C. §101); the strongest, most defensible claim is the **matched enzyme+fiber pair / co-design method**, which is the white space. Carbios (116 titles / 30 families), Samsara Eco, and Protein Evolution all engineer enzymes to attack *existing* commodity plastics; none co-designs a purpose-built cleavable fiber with its bespoke enzyme. File a micro-entity provisional (~$60-130 USPTO + ~$2-4K attorney) on the matched-pair method + lead sequences before the Cox application closes (June 28 2026). The residency ask: "$10K + 6 weeks to wet-lab-validate the keystone experiment, file the provisional, and submit the NSF Project Pitch."

---

## 7. Quick checklist

- [ ] Engine B pipeline runs end-to-end on RunPod, smoke-tested before any production run, image pinned + second install path tested.
- [ ] MIT/CC-BY tools only; AlphaFold3, ESM3, Chai-2 confirmed absent.
- [ ] Theozyme anchored on UMG-SP2 TS geometry; designed triad is Ser-His-Asp at pH 7.0-8.5; barrier-value discrepancy (20.8 vs 21.2 kcal/mol) resolved in `PLAN.md`.
- [ ] PLACER metrics reported with uncertainty against the Lauko thresholds; FoldSeek TM < 0.5 for any de novo claim; no fabricated kcat/Km.
- [ ] Engine A enumerates aliphatic-only; filters to 25-35 wt% hard, soft Tg < -50 C, elongation >= 400%; cleavable bond in the soft segment; labeled constraint-guided screening, never generative.
- [ ] All artifacts conform field-for-field to `data/contract.md`, carry `inSilico: true`, carry confidence/intervals, and `manifest.json` has real SHA-256s.
- [ ] Top 3 matched pairs pre-computed; `.bcif` files ready; `topPairs.json` cross-references real ids.
- [ ] Placeholders removed by the **June 15 EOD** freeze gate; fallbacks decided, not deliberated, if anything slips.
