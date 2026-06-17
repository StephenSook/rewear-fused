# Engine C, Pitch-Support Pack (Residency + Cox judges)

> **Owner:** Vinh (Engine C lane). **Audience:** residency panel + Cox cleantech judges, the "commercially deployable in Year 1" half of the pitch.
> **Sourcing rule (non-negotiable):** every number below is traceable to `docs/vinh_handoff.md §7`, itself sourced from the four research PDFs (Techno-Economic & Life-Cycle dossier; IP Landscape & FTO analysis; Engine C; Molecular Asset & Data). **No number is invented here.** Where a figure is illustrative-by-analogy or from a secondary benchmark, the caveat travels *with* the number, that honesty is the moat, not a weakness to hide.
> **Presentation discipline:** always quote best/expected/worst bands + a TRL label. Never give an LCA-literate judge a single point estimate.

---

## 0. The one-line frame

**Engine C is the deployable compliance product: a Digital Recyclability Passport that ships with a pre-encoded children's-apparel chemical-compliance brain, not just a data container.** It generates revenue (EPR fee reduction + testing-cost savings) *before any recycling plant exists*. That is the asset-light Year-1 wedge in front of the long-horizon molecular bet (Engines A/B).

**TRL framing (be precise, judges will probe):**
- The passport JSON pins `trl: "TRL 2-3"` and `inSilico: true` for the **whole in-silico molecular co-design system** (the matched fiber+enzyme), a locked honesty field, never contradict it.
- **Engine C as a software product** (the compliance classifier + DPP + live endpoint) is materially more mature (~TRL 6 per CLAUDE.md §2): it runs, it's deployed, it classifies real recall data. Frame the *software* maturity higher in narrative, but the JSON field stays `"TRL 2-3"` because it describes the co-design system the passport references.

---

## 1. What's actually built and honest (the credibility floor)

Lead with what's real before you talk markets, it earns the right to the projections.

- **Real public data only.** Live ingest of the **CPSC SaferProducts API → 631 real recalls** (353 with a mapped regulatory category). No synthetic garments in the judged path.
- **Honest, REAL achieved PR-AUC** (5-fold CV, from `classifier.model.train()` on the 631-recall corpus, these are the actual numbers, not aspirational):
  | Label | PR-AUC | ROC-AUC | Positives | Base rate | Read it as |
  |---|---|---|---|---|---|
  | Flammability (CPSIA sleepwear) | **0.990** | 0.992 | 206 | 0.326 | Strong, product-type signal, **not** keyword-cheating (label terms stripped in `model.py:_strip_label_terms`) |
  | Drawstring (CPSIA 1610) | **0.960** | 0.970 | 142 | 0.225 | Strong |
  | Lead (CPSIA substrate) | **0.246** | 0.892 | 12 | 0.019 | **Honestly low**, rare positives (1.9%); the deterministic rule (100 ppm) owns this decision, not the ML |
- **⚠️ Reconcile deck vs artifact (a judge WILL check):** the per-garment passport / `classifications.json` reports the **macro average across labels: `prAuc = 0.732`, `auc = 0.951`** (`build.py:95`). That is *not* a contradiction of the 0.99 above, it's the mean of the three per-label models, dragged down by the deliberately-honest lead score. **Lead with the macro 0.732 as "the number on the passport," then decompose into the per-label table** so the 0.732 ↔ 0.99 gap is explained before it's questioned.
- **Why we report PR-AUC, not ROC-AUC:** on rare positives ROC-AUC "lies", **lead is ROC-AUC 0.892 but PR-AUC 0.246** (right there in the table). PR-AUC is the honest metric under class imbalance; we report the unflattering real number rather than the flattering one.
- **Frozen-model parity, verified live:** the served bundle is hashed against a signed manifest on startup; the endpoint **refuses to boot** on any mismatch. Verified byte-identical on the deployed Render host (`frozen_parity_sha = bb95f4e8…`). The per-passport **Ed25519 signature** is the cryptographic authenticity anchor.
- **The architectural pitch line:** *a single tabular model cannot represent the hard deterministic structure of statutory thresholds, and regulators will correctly distrust a probabilistic "is lead < 100 ppm."* Engine C uses ML only where it belongs (missing-field inference, free-text classification, structural substance matching); the **deterministic rule layer owns every statutory decision.** That division is exactly why a regulator trusts it.

---

## 2. Techno-economic numbers (from the Techno-Economic dossier, §7.1)

> Present as bands. Every figure carries its source-quality caveat.

### 2.1 The leverage story (not bulk tonnage)
The ~2–5% elastane that makes recyclers reject a blended stretch garment strands the recyclable **95–98%** (cotton/polyester). *"Just 1% elastane is sufficient for the garment to be rejected at a recycling sorting plant"* (Textiles Intelligence); ≥ 5% clogs shredders (TU Wien). **We fix the small fraction that strands the large one.**

### 2.2 CO₂e avoided

| Metric | Worst | Expected | Best | Note |
|---|---|---|---|---|
| Per tonne of blended stretch garment diverted | ~1.5 t | **~2 t CO₂e** | ~4 t | dominated by virgin-fiber displacement + avoided landfill/incineration |
| Per child's garment | 0.2 kg | **~0.3 kg** | 0.4 kg | |
| At 100,000 t/yr program scale |, | **~200,000 t CO₂e/yr avoided + ~100,000 t waste diverted** |, | |

**Why elastane is the lever:** virgin elastane is **~15–20 kg CO₂e/kg** (~17 at 70 dtex commonly cited; some sources ~20), among the most carbon-intensive mass-market fibers.
> ⚠️ *Caveat (state it):* from secondary LCA benchmarks, not one primary peer-reviewed dataset. Triangulate before publishing a point value.

### 2.3 Abatement cost

| Worst | Expected | Best |
|---|---|---|
| > $500/t CO₂ | **$50–200/t CO₂** | negative (profitable recycling generating saleable fiber) |

Benchmark: direct air capture ~$600–1,000/t by 2030. An expected **< $200/t pathway with a co-product revenue stream** is a strong cleantech number.
> ⚠️ *Caveat:* modeled by analogy to NREL PET economics, **not** a REWEAR-FUSED-specific TEA, label it illustrative early-stage. NREL/BOTTLE figures are PET; elastane's carbamate chemistry needs different enzymes and likely thermal pretreatment, which raises process cost vs the PET base case.

### 2.4 Enzyme cost is NOT the binding constraint
NREL/BOTTLE's enzymatic-PET TEA shows recycled monomer at cost parity (recycled PET **$1.51/kg vs $1.87/kg virgin**, 2025 *Nature Chem Eng*). Minimum selling price is dominated by **solids loading and conversion yield**, not enzyme loading/cost (which moves MSP only ~5–9%). → The R&D risk sits in yield, not in "enzymes are expensive."

### 2.5 The pre-emptive honesty check (keep it in the deck)
Per **Uekert 2022, *Green Chem.***: as-modeled at ~TRL 5, enzymatic hydrolysis can perform **1.2–17× worse than virgin** until yields improve and amorphization pretreatment / pH control are eliminated. **The carbon case rests on displaced virgin production + avoided end-of-life, NOT on the process being intrinsically clean.** Saying this out loud pre-empts the "hand-waving" critique, and signals you've read your own LCA honestly.

### 2.6 Method-stack to cite (pre-empts the LCA critique)
ISO 14040/14044 + EU PEFCR Apparel & Footwear v3.1 (EC-welcomed 25 Jun 2025) + Higg MSI + WBCSD Avoided Emissions Guidance v2.0 (Jul 2025); model in SimaPro/OpenLCA on ecoinvent 3.10; **report avoided emissions separately from Scope 1/2/3 per SBTi.**

---

## 3. SB 707 / EU EPR fee angle, revenue before a plant exists (§7.2)

**The thesis:** the Digital Recyclability Passport + recyclable-by-design elastane is a **fee-reduction / malus-avoidance compliance product with willingness-to-pay today**, the asset-light wedge.

### 3.1 California SB 707 (Responsible Textile Recovery Act of 2024)
- Producers must join **Landbell USA by 1 July 2026**.
- Eco-modulated fees with **malus penalties target exactly the poly-cotton-elastane blends REWEAR-FUSED fixes**.
- Penalties up to **$50,000/day**; full implementation ~2030.

### 3.2 France Refashion, the worked demo example
- Baseline eco-contribution: *"just under 4 centimes per item for 2024."*
- A Carter's recycled-elastane onesie stacking bonuses, durability (€0.07 or €0.70 ref × category factor) + environmental-certification (€0.30 or €0.03; eligible: OEKO-TEX MADE IN GREEN, GOTS, EU Ecolabel) + recycled-material (€500–€1,000/tonne), can earn **up to ~€1.00 vs the ~€0.04 baseline ≈ a ~25× return per garment.**
- Refashion's own max example: *"a T-shirt paying an eco-contribution of 2 centimes could receive up to a one-euro bonus."*

### 3.3 Compliance-testing savings to price against
Per-SKU children's-apparel testing: CPSIA panel **$380–$3,000/SKU**, full AAFA RSL **$800–$2,500/SKU**, ZDHC MRSL Level 1 **$1,500–$4,000/formulation**. A brand launching **500 SKUs/season faces $0.5M–$2M/year** in chemical-compliance testing alone.
→ **Price the SaaS as a percentage of (testing-cost savings + EPR-fee savings).** Pitch line: *"the only DPP platform that ships with a pre-encoded children's-apparel chemical-compliance brain, not just a data container."*

### 3.4 DPP software market (cite ranges, scopes vary)
- MarketsandMarkets: **$185.9M (2024) → $1,780.5M (2030)**, 45.7% CAGR.
- The Business Research Company: **$1.35B (2025) → $5.64B (2030)**, 33.3% CAGR.
- Comparable raises confirming the thesis: EON $20.5M total ($10M Series A), TrusTrace $30M ($24M Series B), Retraced €15M Series A, Worldly $54M total ($50M Series B).

### 3.5 Cox framing
Cox led **Nexus Circular's $150M round (Jan 2023)**, became majority owner, surpassed **$3B in cleantech investment**. Nexus turns hard-to-recycle plastic into ISCC-PLUS-certified virgin-equivalent feedstock. → **REWEAR-FUSED = "Nexus for stretch textiles"**: biological recycling of the blended feedstock pyrolysis can't cleanly address.
> Market-timing note: **The LYCRA Company filed Chapter 11 on 17 March 2026**, incumbent fragility = opportunity narrative, *but also* feedstock-supply uncertainty. Use both halves.

---

## 4. IP / FTO talking points (from the IP Landscape & FTO analysis, §7.3)

### 4.1 The moat is the matched-pair co-design itself
A **system + method claim** covering simultaneous creation of an enzymatically-cleavable aliphatic segmented PU-urea elastane **AND** a de-novo urethanase designed against that fiber's engineered cleavage site. **"Design the lock and the key together."** Every major incumbent (Carbios, Samsara Eco, Protein Evolution, Epoch Biodesign, Covestro/Greifswald) does the opposite, engineering enzymes to attack *pre-existing* commodity plastics. **This appears to be genuine white space.**

### 4.2 FTO is favorable but not unconditional
- **Dangerous patents:** sequence-specific composition-of-matter claims (Covestro WO2023194440A1 / US 12,351,853; the EP3587570A1 urethanase family) and Carbios's process claims (US 10,124,512).
- **Design-arounds:** (1) keep the de-novo enzyme's identity to UMG-SP2 and to Covestro SEQ ID NO:1-3 **well below claimed variant bands** (claims reach ±15% ≈ ~85% identity; **target < 50%, ideally < 40%**; clear with FoldSeek/BLAST pre-filing); (2) avoid the specific claimed glycolysis-then-urethanase two-step process language; (3) ensure the cleavable fiber chemistry is distinct from US 6,221,997's amino-acid-chain-extender claims.
- **Not patentable subject matter:** the catalytic mechanism (**Ser-His-Asp**), only specific sequences and processes are. (Ties to the locked Constraint 2 story.)

### 4.3 Open-source design tools do NOT encumber ownership
RFdiffusion2, LigandMPNN (MIT), Boltz-2, FoldSeek (GPL-3.0 for the *tool*, not the output), permissive; none claims ownership of generated sequences/structures. **REWEAR-FUSED can patent its de-novo enzyme.**
> ⚠️ *Caveat:* verify each model-**weights** license at filing, some weights carry separate, occasionally non-commercial terms.

### 4.4 The provisional-filing path (satisfies Cox's "active progress toward securing IP")
- **File Provisional #1 immediately** (co-design method + matched fiber+enzyme system). USPTO provisional fee is **as low as $60 (micro-entity) / $130 (small-entity)** (37 CFR 1.16(d), eff. 19 Jan 2025); attorney prep adds ~$500–$1,500 basic. A provisional needs no formal claims.
- **Even a single $60–$130 provisional converts "an idea" into "active IP progress."**
- Then: FTO memo within 30–60 days against the named families → Provisional #2 (validated fiber + enzyme sequences) as data matures → convert to non-provisional + PCT within 12 months. **Priority order: system → method → fiber → enzyme.**

### 4.5 Engine C's own IP posture, DEFENSIVELY PUBLISH, don't patent
The Digital Recyclability Passport layer largely **implements the EU ESPR/DPP standard (Reg (EU) 2024/1781)**, so it's unlikely to be strongly patentable (it tracks a regulatory standard). **Defensive publication** (timestamped disclosure) blocks others from patenting it while avoiding wasted prosecution cost. → **This is the right posture for the Engine C lane:** it is the *deployable compliance product and the standards-conformance story*, not a patent asset. Say that to the residency judge plainly.

### 4.6 The three-layer moat (the close)
1. **Paradigm moat**, *"we design the lock and the key together; incumbents only make keys for old locks."*
2. **Filed-IP moat**, a provisional/PCT on the system + method, with enzyme and fiber as composition backstops.
3. **FTO moat**, de-novo enzyme below all claimed identity bands + novel fiber + distinct process = commercialize without licensing incumbents.
> ⚠️ *Caveat (from the source):* this used public Google Patents/USPTO/Espacenet snippets, **a professional FTO search is required before relying on white-space conclusions for fundraising or filing.**

---

## 5. Judge-defense one-liners (have these ready cold)

- **"Flammability 0.99, isn't that too good / cheating?"** → It's product-type signal, not the word "flammable." The label-defining keywords are stripped from features (`model.py:_strip_label_terms`); it predicts from product type + co-occurring language. Honest.
- **"Lead is only 0.25, weak model?"** → Honestly low: only 12 positives (1.9% base rate). ROC-AUC flatters it to **0.892**, we report PR-AUC **0.246** instead. The **deterministic rule** (100 ppm CPSIA) owns the lead decision, which is exactly why a regulator trusts it. The ML isn't deciding lead.
- **"Your passport says 0.732 but your slide says 0.99, which is it?"** → Both, honestly: **0.732 is the macro average** of the three label models; **0.99 / 0.96 / 0.25** are the per-label scores. The passport carries the macro number; the per-label table shows the spread. Nothing is cherry-picked, the low lead score is *in* the average.
- **"Is this real or in-silico?"** → The molecular co-design is **TRL 2-3, in-silico**, stamped in every passport, never hidden. The *compliance software* (classifier + DPP + live endpoint) is real and deployed today on real recall data.
- **"SHAP?"** → No. The field is honestly named `compositionDrivers`, real composition ratios, not SHAP attributions. (Real SHAP is a tracked stretch item, not claimed until shipped.)
- **"aromaticAmineRelease?"** → Always **"NONE"**, the aliphatic-isocyanate design has no MDA/TDA pathway (REACH Annex XVII Entry 43, 30 mg/kg). Locked Constraint 1.

---

## 6. Sourcing & caveat ledger (so nothing is overclaimed)

| Claim | Source | Confidence / caveat |
|---|---|---|
| 631 CPSC recalls; per-label PR-AUC 0.990/0.960/0.246; macro 0.732 | `classifier.model.train()` re-run this session | **Verified, first-party** (matches `classifications.json`) |
| Frozen-parity SHA `bb95f4e8…`, refuse-to-boot | live Render endpoint + manifest | **Verified, first-party** |
| ~2 t CO₂e/t diverted; ~0.3 kg/garment | Techno-Economic dossier | secondary LCA benchmarks, triangulate |
| Virgin elastane ~15–20 kg CO₂e/kg | dossier | secondary, not one primary dataset |
| Abatement $50–200/t | dossier | by-analogy to NREL PET, illustrative early-stage |
| SB 707 dates / $50k/day; Refashion ~25× | dossier | regulatory text + Refashion published examples |
| Testing $0.5M–$2M/yr per 500 SKUs | dossier | per-SKU panel ranges |
| DPP market CAGRs; comparable raises | MarketsandMarkets / TBRC | cite ranges, scopes vary |
| FTO white-space, identity bands | IP/FTO analysis | **public-snippet search, professional FTO required before filing/fundraising** |
| $60/$130 provisional fee | 37 CFR 1.16(d), eff. 19 Jan 2025 | regulatory fee schedule |

---

*This pack assembles `docs/vinh_handoff.md §7` for delivery. Authoritative spec stays in the handoff; shapes in `data/contract.md`. Enzyme/fiber matched-pair questions → Pravin. The `aromaticAmineRelease: "NONE"` and Ser-His-Asp / aliphatic-isocyanate stories are locked Constraints (CLAUDE.md §2), never present anything that contradicts them.*
