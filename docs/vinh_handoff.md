# Vinh Handoff: Engine C, Data ETL, and the Live Endpoint

> **Owner: Vinh.** Engine C (the Digital Recyclability Passport: chemical-compliance classifier + EU Digital Product Passport), data ETL, and the live deployed `/classify` endpoint + keepalive.
> **Consumers: the frontend (VIEW 2, the demo floor) and the residency pitch.**
> Source of truth for output shapes is `data/contract.md`. Everything Engine C emits conforms to it field-for-field. Read `CLAUDE.md` §14 (Engine C toolchain) and the Operating Contract first.
> Provenance note: every number, threshold, dataset, and citation in this doc is sourced from the four research PDFs (`research-reports/Engine C.pdf`, `Molecular Asset and Data.pdf`, `Techno-Economic and Life-Cycle Impact Dossier`, `IP Landscape ... FTO Analysis`). Where a number is not in those sources it is marked "not specified in sources." Do not invent thresholds, dataset URLs, or accuracy figures.

---

## 0a. What Stephen built as a REFERENCE (your running start) vs what is YOURS to own

Stephen built a working Engine C reference skeleton so the demo floor is never at zero and the contract shapes are proven against real data. **It is a reference, not your finished lane.** It covers maybe a fifth of this doc. The depth below is yours.

**Done (reference, in `engine-c/`):**
- `ingest/cpsc.py`: live CPSC Recalls API only (631 real recalls, labeled). *Not yet:* EU Safety Gate, PFAS (Toxic-Free Future/Peaslee), OEKO-TEX negatives, EPA CompTox/PubChem (§3.2-§3.5).
- `classifier/model.py`: per-label CatBoost over recall text, honest CV PR-AUC. *Not yet:* `ClassifierChain` for label dependencies, ChemBERTa-2/MolFormer featurization, isotonic calibration, the imbalance handling (§1.2-§1.3, §5).
- `classifier/rules.py`: a STARTER deterministic layer (ESPR/elastane, PFAS-finish, aromatic-amine). *Not yet:* the full **85+ threshold corpus** (§2: CPSIA sub-limits, all REACH Entry 72/77 sub-limits, every state PFAS law, full OEKO-TEX Class I table, SB 707).
- `classifier/build.py` + passports: real W3C VC 2.0 with **Ed25519 `did:key`** signatures + GS1 Digital Link. *Not yet:* `did:web` on the team domain, SHAP "why-flagged" (§1.4, currently a stub), the UNTP `renderMethod` HTML render, optional EBSI/Merkle tamper-evidence (§4).
- `api/main.py`: serves the real bundle locally. *Not yet:* **Render deploy + keepalive cron + frozen-model SHA verification on startup (§6 / task 3.4)**. That whole task is yours.
- **Entirely yours, untouched:** the pitch-support pack (§7: techno-economic numbers, SB 707/EPR fee angle, IP/FTO talking points). That is the residency-judge half of the pitch.

**How to take it over:** the contract shapes and the honest-metric discipline are locked in; extend the ETL to the other datasets, expand the rule corpus, add the ML depth, then deploy. Re-run `python -m classifier.build` + `python scripts/sync_artifacts_to_frontend.py` and the frontend picks up your real numbers with zero changes. Claim each task in `PLAN.md` (set 🟡, your name, timestamp) before you start.

---

## 0. The one honesty conflict to resolve first (read this before you write any ETL)

The Engine C source PDF repeatedly recommends a **synthetic ~10,000-SKU Carter's-style garment population with ~3% non-compliance injected** as the negative population for the ML layer (PDF Part 2.J and Part 3, Recommendation 2). **Do not put that synthetic population in the judged path.** It directly violates the Demo Evidence Rule (`CLAUDE.md` Operating Contract) and Decision D3 in `PLAN.md`: "No synthetic data in the judged path." This is the exact failure mode (APEX: "synthetic data") that we are explicitly avoiding.

Resolution, locked for this build:
- **Train and report on REAL public data only**: CPSC SaferProducts recalls, EU Safety Gate / RAPEX, Toxic-Free Future "Mind the Store" + Notre Dame / Peaslee PFAS datasets, and OEKO-TEX certificates as compliant negatives. Small-but-real beats large-but-synthetic.
- **The demo garments** (`data/artifacts/v1.0.0/garments/garments.json`) are **real Carter's product archetypes with real published fiber compositions** (Stephen's `Garment` shape requires `fiberComposition[].source` to be a real published percentage). They are inputs to be classified, not training rows.
- **Class imbalance is real and you report it honestly.** Positives are <5% per label (PDF Part 3.3). Do not paper over it with synthetic positives. Document the imbalance, use the imbalance-aware training below, and report **PR-AUC, not ROC-AUC** (ROC is misleadingly high when positives are rare). If a label has too few real positives to hit the PR-AUC target, say so in the manifest and the passport, do not fabricate a number.

If you ever feel pressure to pad the training set to make a metric look better, that is the signal to stop and report the honest metric instead.

---

## 1. Classifier architecture (rules-first, ML-for-the-residual, explain-don't-decide)

A **hybrid neuro-symbolic** stack. The order of consultation is load-bearing: deterministic rules FIRST, ML only on the residual ambiguous cases, LLM only to explain.

### 1.1 Deterministic rule layer (consulted FIRST, always)
- Encode all **85+ numeric thresholds** from Part 2 below as Python rule objects. Each rule carries: `statute_citation`, `chemical_cas`, `threshold_value`, `unit`, `matrix`, `age_group`, `effective_date`, `severity` (PDF Part 5, Recommendation 1).
- With complete composition data, **rules alone decide**, and ML is not consulted. Example from the PDF: `IF age_group <= 12 AND lead_substrate_ppm > 100 THEN flag(reg="CPSIA §101", severity="HARD_FAIL")`.
- This is the part judges and regulators trust. A probabilistic estimate of "is lead < 100 ppm" is correctly distrusted; a cited deterministic threshold check is not. In the `Classification.triggeredRegulations[]` output, every rule-driven entry sets `measuredOrPredicted: "deterministic"`.
- Optional knowledge-graph backing (PDF Part 3.1): Garment to MaterialBOM to Substance(CAS) to RegulationEntry to Threshold, as RDF triples queryable via SPARQL (Apache Jena) or Neo4j. The KG is a nice-to-have for the wow factor; the flat rule table is the must-have. Build the flat table first.

### 1.2 CatBoost classifier-chain (ML, residual uncertain cases only)
- The ML layer runs **only where rules cannot decide**: unknown supplier, missing test data, partial composition (PDF Part 3.3).
- Model: **CatBoost** (the PDF cites CatBoost v1.2 / v1.x; use current stable). Native categorical support for supplier name, country, color, fiber as categoricals; outperforms LightGBM/XGBoost on this mixed-type tabular data per the PDF.
- Wrap in scikit-learn **`ClassifierChain`** so label dependencies are respected. The PDF's examples: AB 1817 positive correlates with Cal-EPR risk; OEKO-TEX absence elevates REACH risk.
- Imbalance handling: focal-style loss (CatBoost `loss_function="Logloss"` + class weights) or `imbalanced-learn` SMOTE-NC. Positives are <5% per label. (Note: SMOTE-NC synthesizes minority-class *feature vectors* during training to balance gradients; that is a standard training-time technique and is distinct from injecting fake garments into the judged dataset. Keep it inside the training loop, never in the demo garments or the reported test set.)
- Calibration: **isotonic regression on a held-out fold**, so `Classification.probability` is a calibrated 0..1 value (PDF Part 3.3).

### 1.3 ChemBERTa-2 / MolFormer featurization
- For substances of concern, featurize chemical structure so the model generalizes to novel/unknown chemicals (PDF Part 3.4 + Molecular-Asset PDF Part 5.3):
  - RDKit Morgan fingerprints (radius=2, 2048 bits) as the classical baseline.
  - **ChemBERTa-2** embeddings (768-dim), HuggingFace `DeepChem/ChemBERTa-77M-MTR` (trained on 77M PubChem SMILES, RoBERTa backbone).
  - **MolFormer-XL** embeddings, HuggingFace `ibm-research/MoLFormer-XL-both-10pct` (pretrained on ~1.1B molecules, 10% ZINC + 10% PubChem) for generalization to novel SoCs.
- Pipeline to get from a detected chemical to a feature (Molecular-Asset PDF Part 5.4): detected name/CAS to DTXSID (EPA CTX API or DSSTox CSV) to canonical SMILES to PubChem CID to GHS classification + ECHA SVHC flag, then featurize via ChemBERTa-2 or Morgan FP.

### 1.4 SHAP "why flagged"
- **SHAP `TreeExplainer`** per prediction; surface the **top-5 SHAP features** into the passport's "why-flagged" panel (PDF Part 3.3). This maps to `Classification.shapTopFeatures[]` (`{feature, weight}`) in the contract.
- SHAP runs only on ML-driven flags. Deterministic flags do not need SHAP; their explanation is the cited threshold itself.

### 1.5 Optional LLM-RAG explainer (EXPLAINS, never DECIDES)
- LlamaIndex/LangChain RAG over a vectorized corpus of statutory text (CPSIA, REACH, AB 1817, Refashion grid), ECHA guidance, CPSC FAQs, OEKO-TEX criteria (PDF Part 3.5).
- **The LLM never decides compliance.** It (a) renders a human-readable explanation of a decision the rules/ML already made, and (b) parses unstructured supplier datasheets and free-text recall descriptions into structured features. This is a hard boundary: the decision is owned by §1.1 and §1.2.
- Backend models from the PDF: `gpt-4o-mini` or `claude-3.5-haiku` for cost; embeddings via `text-embedding-3-large`. The endpoint must work with the LLM drawer OFF (demo-safety: the classification result cannot depend on a live LLM call).
- Chemical NER for parsing free text: scispaCy `en_ner_bc5cdr_md` or ChemListem (PDF Part 3.6).

**Why this beats a single model (the pitch line):** a single tabular model cannot represent the hard deterministic structure of statutory thresholds, and regulators will correctly distrust a probabilistic "is lead < 100 ppm." Engine C uses ML only where it belongs: filling missing fields, predicting risk from supplier history, classifying free-text, and matching unknown substances by structure (PDF Part 3, closing).

---

## 2. The full regulatory universe (exact thresholds + citations + dates)

These are the rule corpus. All values below are verbatim from `Engine C.pdf` Part 1 and the Appendix threshold table. Map each to a `Regulation` object in `compliance/regulations.json` (`id`, `name`, `jurisdiction`, `limit`, `citation`, `effectiveDate`).

### 2.1 US Federal: CPSC / CPSIA (15 U.S.C. § 2051 et seq. / 16 CFR)
Scope: products "designed or intended primarily for children 12 years of age or younger."
- **Lead in substrate:** ≤ 100 ppm (0.01%). CPSIA §101(a); 16 CFR §1500.87, §1252.1(a). Note: 16 CFR §1500.91(d)(7) exempts natural/manufactured-fiber textiles (dyed/undyed, not screen-printed or after-treated) from third-party lead testing. Encode this as a default exemption.
- **Lead in paint/surface coatings:** ≤ 90 ppm (0.009%). 16 CFR §1303.
- **Eight phthalates** at > 0.1% (1,000 ppm) each, any accessible component of children's toys/child-care articles: DEHP, DBP, BBP, DINP, DIBP, DPENP, DHEXP, DCHP. 16 CFR §1307; CPSIA §§108(a),108(b)(3). Children's sleepwear and bibs are child-care articles, in scope.
- **Flammability, 16 CFR Part 1610** (wearing apparel textiles): Class 1 plain ≥ 3.5 s, raised ≥ 7 s; Class 2 raised-only 4.0-7.0 s with SFBB; **Class 3 prohibited** (plain < 3.5 s, OR raised < 4.0 s with base burn). Specimen 50 mm × 150 mm, 45° angle.
- **Flammability, 16 CFR Part 1615 (sizes 0-6X) / 1616 (7-14)** children's sleepwear: avg char length of five specimens ≤ 7 in (178 mm); no single specimen > 10 in (254 mm); tested as-produced and after 50 launderings (AATCC 124-1996). **Exemption: tight-fitting sleepwear** meeting §1615.1(c)/§1616.2(c) dimensional limits. The PDF flags this exemption as "exactly REWEAR-FUSED's competitive surface" since stretch elastane garments often qualify.
- **Children's Product Certificate (CPC)** + third-party testing + tracking labels: §14(a)(2) CPSA; 16 CFR §§1107, 1109, 1110.
- **Civil penalties:** $120,000 per violation; $17,150,000 aggregate for a related series (effective for violations after 1 Jan 2022; 86 FR 68244, 1 Dec 2021). Next CPSC five-year adjustment due 1 Dec 2026 / effective 1 Jan 2027. The CAP Act (would raise per-violation cap to $250,000) was introduced 25 Jan 2024 and is **not enacted as of mid-2026**. Do not cite it as law.

### 2.2 US State PFAS-in-textiles laws
| State | Statute | Effective | Threshold / mechanism |
|---|---|---|---|
| California | AB 1817 (Safer Clothes and Textiles Act, H&S §108970-108971) + AB 347 | 1 Jan 2025 | Intentionally added PFAS prohibited; **TOF ≤ 100 ppm from 1 Jan 2025, ≤ 50 ppm from 1 Jan 2027**. Outdoor severe-wet exempt with disclosure until 1 Jan 2028. Certificate of Compliance required. DTSC enforcement from 1 July 2030; penalties ≥ $10,000/violation |
| New York | S1322/A994 → Env. Cons. Law §37-0121 | 1 Jan 2025 | Intentionally added PFAS prohibited; DEC must set a numerical threshold by 1 Jan 2027 |
| Maine | LD 1503 (2021) → LD 1537 (2024); 38 MRSA §1614 | Phased: 1 Jan 2026 (textile articles, juvenile products) | Total ban subject to "Currently Unavoidable Use" exemption (5-yr renewable) |
| Minnesota | Amara's Law, Minn. Stat. §116.943 | 1 Jan 2025 (Phase I incl. juvenile products, textile furnishings); reporting due 15 Sept 2026 (PRISM 1.0) | Total ban with CUU exemption |
| Colorado | HB22-1345; HB23-1215 | 1 Jan 2025 (outdoor severe-wet + disclosure) / 1 Jan 2028 (all textile articles) | Total ban |
| Washington | Safer Products for WA (RCW 70A.350) Cycle 1.5 | Phased reporting 2025-2026 | Notification + restrictions per rulemaking |
| Rhode Island | H 7356 / S 2152 (2024) | 1 Jan 2027 (textile articles ban) | Ban |
| Vermont | S.25 (2024) | 1 July 2026 (apparel ban) | Ban |
| Connecticut | Public Act 24-59 + DEEP Final Labeling Order (Dec 2025) | Labeling from 1 July 2026; restrictions 2028-2032 | Phased ban + labeling |
| Oregon | Toxic-Free Kids Act (HB 3043, 2015) | Ongoing | CHCC reporting/disclosure for children's products |

### 2.3 California Proposition 65 (H&S §25249.5; OEHHA safe-harbor levels)
Lead MADL 0.5 µg/day (binding figure for textiles); Cadmium oral MADL 4.1 µg/day; DEHP NSRL 310 / MADL 410 µg/day; DBP MADL 8.7 µg/day; BBP MADL 1,200 µg/day; DINP NSRL 146 µg/day; Formaldehyde (inhalation) NSRL 40 µg/day; BPA (dermal) MADL 3 µg/day. Applies to businesses with ≥ 10 employees selling in CA.

### 2.4 EU: REACH (Reg (EC) 1907/2006) Annex XVII
- **Entry 43 (azo dyes):** azo colorants releasing any of 22 carcinogenic aromatic amines (Appendix 8) at **> 30 mg/kg** in skin-contact textiles/leather are prohibited. Test: EN ISO 14362-1/-3, EN ISO 17234-1/2. (This is the entry directly relevant to REWEAR-FUSED's aliphatic-isocyanate story: the passport shows "aromatic amine release: NONE.")
- **Entry 47 (Cr VI in leather):** ≤ 3 mg/kg.
- **Entry 50 (PAHs):** 8 PAHs ≤ 1 mg/kg (skin-contact); ≤ 0.5 mg/kg (toys/childcare).
- **Entry 72 (33 CMR Cat. 1A/1B substances in clothing/skin-contact textiles/footwear), Reg (EU) 2018/1513, effective 1 Nov 2020:** Formaldehyde ≤ 75 mg/kg (300 mg/kg derogation expired 1 Nov 2023); Quinoline ≤ 50 mg/kg; Disperse Blue 1 / Orange 37/76/59 / Yellow 3 ≤ 50 mg/kg each; Benzene ≤ 5 mg/kg; Cd, Pb, Cr(VI), As ≤ 1 mg/kg each; PAHs (8) ≤ 1 mg/kg each; three chlorotoluenes ≤ 1 mg/kg each; Σ(DEHP+DBP+BBP+DIBP) ≤ 1,000 mg/kg; DMAc, DMF, NMP ≤ 3,000 mg/kg each; di-C6-8-branched-alkyl-ester phthalate ≤ 1,000 mg/kg.
- **Entry 77 (formaldehyde in articles), Reg (EU) 2023/1464, applies 6 Aug 2026:** 0.062 mg/m³ (wood/furniture); 0.080 mg/m³ (other articles incl. textiles). **Note:** articles in scope of Entry 72 are exempt from Entry 77. Entry 72's 75 mg/kg content limit binds finished textiles.
- **Entry 27 (nickel release):** ≤ 0.5 µg/cm²/week (prolonged skin contact); ≤ 0.2 µg/cm²/week (piercing posts). EN 1811.

### 2.5 EU: ESPR / Digital Product Passport
- Regulation (EU) 2024/1781 (ESPR), in force 18 July 2024, full application 19 July 2026.
- ESPR Working Plan 2025-2030 (16 April 2025) names textiles a priority: **delegated act adoption indicatively 2027; mandatory DPP earliest 2028** (after an 18-month application window).
- EU Central DPP Registry goes live alongside ESPR full application 19 July 2026.
- **Caveat (from the PDF, state it in the UI):** the textile delegated act is NOT adopted as of mid-2026. The DPP data fields are a **projected schema** from CIRPASS-2 working docs + the Battery Regulation precedent + the JRC Textile Preparatory Study (3rd milestone, Dec 2025). Label it "best available draft," not law. If the official schema publishes before pitch day, swap it in.

### 2.6 OEKO-TEX Standard 100 Edition 2025: Class I (babies ≤ 36 months), the strictest class
- Formaldehyde: not detectable, < 16 mg/kg (ISO 14184-1).
- Extractable heavy metals (artificial saliva/acid sweat, mg/kg): As 0.2; Pb 0.2; Cd 0.1; Cr 1.0; Cr(VI) 0.5 (detection limit); Co 1.0; Cu 25.0; Ni 1.0; Hg 0.02; Sb 30.0.
- pH 4.0-7.5; Pesticides (sum) ≤ 0.5 mg/kg; PCP ≤ 0.05, TeCP ≤ 0.05 mg/kg.
- **Banned azo arylamines ≤ 20 mg/kg each (stricter than REACH's 30 mg/kg).**
- Phthalate sum ≤ 0.05% (Class I); APEOs (NPEO+OPEO) ≤ 250 mg/kg.
- Total PFAS added in Edition 2024: PFOA ≤ 0.025 mg/kg; PFOS ≤ 1.0 µg/m². **Caveat:** confirm exact current PFOA/PFOS/total-fluorine values against the live OEKO-TEX Annex 6 before quoting in a regulated context; the PDF flags this as needing verification.

### 2.7 EU: GPSR (Reg (EU) 2023/988), from 13 Dec 2024
Risk assessment + EU Responsible Person (Art. 16) + traceability labeling + Safety Gate notification for all non-food consumer products incl. textiles.

### 2.8 US: California SB 707 (Responsible Textile Recovery Act of 2024), Pub. Res. Code §§42985-42985.27
Signed 28 Sept 2024. PRO = **Landbell USA**, selected by CalRecycle **27 Feb 2026**. Producer registration **from 1 July 2026** (covered producers > $1M global sales). Needs assessment due March 2027. Plan/regulations no earlier than 1 July 2028; enforcement by 1 July 2030 or plan approval, whichever earlier. Penalties **up to $10,000/day ($50,000/day intentional)**. Per-unit eco-modulated fee. **Caveat:** the fee schedule is NOT yet published; AAFA filed a legal challenge to the Landbell selection on 27 March 2026. The eco-modulation mechanism (lower fees for recyclable/durable/mono-material designs) is statutory intent, not a finalized grid.

### 2.9 Other encodable standards
AAFA Restricted Substances List 25th Edition (2024, 250+ substances, voluntary); ZDHC MRSL v3.1 (2022, input-chemistry); bluesign BSSL.

**Implementation note:** the PDF's Appendix "Threshold Reference Table" is the canonical machine-encodable list. Treat each row as one `Regulation` object. There are ~85+ thresholds when you fully expand the REACH Entry 72 sub-limits and OEKO-TEX Class I sub-limits.

---

## 3. The real public training datasets (and how to ingest each)

All sources below are free and public per the PDF (Engine C Part 2 + Molecular-Asset Part 5). **No paid feeds required for a defensible v1.** This is task **3.1 (Engine C data ETL)** in `PLAN.md`. Land all of this in `data/datasets/` (your lane).

### 3.1 CPSC SaferProducts Recall REST API (positives)
- Endpoint: `https://www.saferproducts.gov/RestWebServices/Recall?format=json` (XML alternative).
- ~9,000+ recall records (~50 MB full pull); real-time updates; **U.S. Government work, public domain.**
- Fields incl. `RecallID`, `RecallDate`, `Description`, `Title`, `Hazards[].HazardTypeID/Name`, `Products[].CategoryID/Name/Description`, `Manufacturers[]`, `ManufacturerCountries[]`, `ProductUPCs[]`.
- **Use as ML positives:** filter `Products.CategoryID` for apparel/children categories; tokenize `Hazards.Name` + `Description` to extract chemical entities ("lead paint", "phthalates"), choking, and flammability classifications. Programmer guide: `RecallRetrievalWebServicesProgrammersGuide20180917.pdf` (v1.4).

### 3.2 EU Safety Gate / RAPEX (positives, EU side)
- Portal: `https://ec.europa.eu/safety-gate-alerts/`. Weekly XML/Excel: `.../api/download/weeklyReport/detail/xml/{week_id}?language=en`.
- ~2,000 notifications/year; ~80,000 historical records. **Re-use permitted with attribution** (Commission Decision 2011/833/EU).
- Fields: alert number, notifying country, product category (toys, clothing-textiles-fashion), risk type (chemical/choking/injury), chemical detected (phthalates, formaldehyde, AZO dyes, lead, cadmium), brand, model, country of origin, measures, image URLs.

### 3.3 PFAS testing datasets (Toxic-Free Future / Peaslee)
- Toxic-Free Future "Mind the Store" retailer testing (`toxicfreefuture.org`): TOF and targeted-PFAS results for hundreds of products incl. children's brands.
- Notre Dame / Graham Peaslee group: total-fluorine PIGE studies, *Env. Sci. Technol. Letters* 2018-2024, supplementary product-level CSV.
- Silent Spring Institute "Detox Me" datasets (`silentspring.org`) as an additional source.

### 3.4 OEKO-TEX as compliant negatives
- OEKO-TEX Buying Guide (`oeko-tex.com/en/buying-guide`): public registry of certificates, queryable by company/country/Standard 100 class. Use certified products as the **clean / compliant negative** population. This is the honest substitute for the synthetic negatives the PDF originally recommended.

### 3.5 Chemical reference data (for featurization + hazard lookup)
- **EPA CompTox Chemicals Dashboard** (1,376,722 chemicals; DTXSID identifiers). API: `https://api-ccte.epa.gov/` (free key from `ccte_api@epa.gov`). Public domain. PFASMASTER list (14,735+ PFAS) at `comptox.epa.gov/dashboard/chemical-lists/PFASMASTER`.
- **PubChem PUG-REST** (`pubchem.ncbi.nlm.nih.gov/rest/pug/`) for structure retrieval and the GHS Classification hazard view; public domain; ≤ 5 req/s.
- **ECHA**: Annex XVII restrictions, SVHC Candidate List, C&L Inventory.

### 3.6 Garment realism (for the demo INPUTS, not training)
- The demo garments are real Carter's archetypes (Stephen owns `garments.json`). If you need to enrich realistic garment metadata, the PDF lists H&M Personalized Fashion Recommendations (Kaggle, 105k articles, research-use; **no fiber composition** so it cannot be the sole source) + Fashionpedia (CC-BY-4.0 category ontology) + GS1 GPC bricks + ISO 3758:2023 care symbols. **Do not generate synthetic Carter's SKUs for the judged demo.** Fiber-composition priors (onesie ~95% cotton / 5% elastane; sleeper ~60/38/2; legging ~90/10) are fine as defaults for archetype enrichment, but the demo's published compositions must be real and cited via `fiberComposition[].source`.

### 3.7 Honest data-balance reporting (required)
- Positives are < 5% per label. Report this in the manifest and on the passport's metrics surface. Use the imbalance-aware training in §1.2. **Report PR-AUC, not ROC-AUC.** If a label lacks enough real positives to hit the target, set its `prAuc` honestly (or `null` with a note) rather than inflating it.

---

## 4. The passport (W3C VC 2.0 / UNTP, GS1 Digital Link, QR): conform to the contract field-for-field

Your passport output is `data/artifacts/v1.0.0/passports/dpp_<garmentId>.json` AND the byte-identical return of `POST /classify`. It MUST match the `DigitalProductPassport` interface in `data/contract.md`:

```ts
interface DigitalProductPassport {
  passportId: string;               // GS1 Digital Link style
  garmentId: string;
  gs1DigitalLinkUri: string;        // "https://id.gs1.org/01/<gtin>/21/<serial>"
  qrPayload: string;                // same URI, encoded into the scannable QR
  classification: Classification;   // embeds the Engine C decision
  aromaticAmineRelease: "NONE";     // Constraint 1 green check (aliphatic design)
  credential: {
    type: ["VerifiableCredential", "DigitalProductPassport"];
    issuer: string;                 // did:web:...
    proof: { type: string; verificationMethod: string; signatureValue: string };
  };
  trl: "TRL 2-3";
  inSilico: true;
}
```

And the embedded `Classification`:

```ts
type Decision = "clear" | "lab-test" | "divert";
interface Classification {
  garmentId: string;
  decision: Decision;
  probability: number;              // 0..1, calibrated (isotonic)
  prAuc: number;                    // PR-AUC for the driving label (PRIMARY)
  auc: number;                      // ROC-AUC, reported secondary
  triggeredRegulations: {
    regulationId: string;
    status: "PASS" | "FLAG" | "FAIL";
    measuredOrPredicted: "deterministic" | "predicted";
    detail: string;                 // e.g. "lead 12 ppm < 100 ppm"
  }[];
  shapTopFeatures?: { feature: string; weight: number }[];
  inSilico: true;
}
```

Conformance rules (from `data/contract.md` and the PDF):
- **Standards stack** (PDF Part 4): DPP issued as a **W3C Verifiable Credential 2.0 (JSON-LD)** with a `ProductPassport` subject under the **UNTP** (`untp.unece.org`) `@context`; signed with a **DID (`did:web`** is the easiest start, the team's GitHub Pages domain). The `credential.proof` carries `type`, `verificationMethod`, `signatureValue`.
- **GS1 Digital Link** (PDF Part 4.B): `gs1DigitalLinkUri` = `https://id.gs1.org/01/{14-digit-GTIN}/21/{serial}`. The PDF cites GS1 Digital Link v1.4.0 (numeric AIs only) over ISO/IEC 18004 QR. The contract field is named `gs1DigitalLinkUri`; the QR encodes the same URI into `qrPayload`.
- **Scannable QR** (PDF Part 4.B recommended specs): Model 2, ECC Level M (15%), min 15 mm × 15 mm @ 150 dpi, quiet zone ≥ 4 modules. Generate with `python-qrcode`. The judge physically scans it on stage, and it must resolve.
- **Three tiers (clear / lab-test / divert)** are the `Classification.decision` enum. Map the rule/ML output to exactly these three values. "clear" = no flags; "lab-test" = ambiguous / ML-flagged residual risk that warrants targeted testing; "divert" = a hard deterministic FAIL.
- `aromaticAmineRelease: "NONE"` is the Constraint-1 green check, always "NONE" for our aliphatic-isocyanate design (this is the literal answer to judge-defense question #1).
- `trl: "TRL 2-3"` and `inSilico: true` are mandatory honesty fields. (`CLAUDE.md` §2 places Engine C at ~TRL 6 as a software product; the contract pins the passport object's `trl` string to `"TRL 2-3"` for the whole in-silico co-design system. Use the contract's literal value `"TRL 2-3"` in the JSON; you can frame Engine C's software maturity as higher in the pitch narrative, but the JSON field is fixed by the contract.)
- **Render path** (PDF Part 4.C): UNTP's `renderMethod` lets the same signed credential render as machine-readable JSON AND a human-readable HTML passport page with the SHAP "why-flagged" panel. The frontend reads the JSON; the HTML render is a bonus surface.
- **Optional tamper-evidence** (PDF Part 4.E, do not let it gate the demo): anchor only a daily Merkle root of credential hashes on EBSI testnet (politically defensible for an EU audience) or Polygon Amoy as a fallback. This is the "tamper-evidence for Cox investors without per-credential cost" story. It is a stretch, not a must.

Placeholder discipline (`data/contract.md` rule 6): during early build, set any not-yet-real numeric field to a plausible mock AND add `"placeholder": true` at the object root so the frontend can badge it. **Remove all placeholders by the artifact-freeze gate (G3, June 15 EOD).**

---

## 5. ML targets

From `Engine C.pdf` Part 3.3, calibration section:
- **Per-label PR-AUC ≥ 0.85** (this is the contract target in `PLAN.md` task 3.2). Report **PR-AUC, not ROC-AUC** as the primary metric because positives are rare (< 5%).
- Macro PR-AUC ≥ 0.80.
- Brier score ≤ 0.05.
- Calibration via **isotonic regression on a held-out fold**, so `Classification.probability` is trustworthy.

Note the tension with `CLAUDE.md` §5 / VIEW 2, which states an "honest target PR-AUC ~0.55-0.75" given rarity. Resolve it this way: **≥ 0.85 is the aspiration the Engine C source sets; 0.55-0.75 is the honest floor the frontend spec accepts.** Report the REAL achieved per-label PR-AUC in `classifications.json` and the manifest, whatever it is. If a label lands at 0.6, that is the number you ship. Do not round it up to clear the 0.85 bar. The honesty IS the moat. Surface the metric on the passport so a judge can see it.

---

## 6. The live endpoint (FastAPI on Render, `POST /classify`, keepalive, frozen-model parity)

This is tasks **3.4 (live endpoint + keepalive)** in `PLAN.md`. Lane: `engine-c/api`.

### 6.1 Service
- **FastAPI on Render** (the PDF Part 5 recommends a FastAPI resolver on Vercel/Fly.io; `CLAUDE.md` §14 + `PLAN.md` lock it to **Render**). Serves the GS1 Digital Link resolver + the classifier.

### 6.2 `POST /classify` shape
- Per `PLAN.md` Shared Contracts: **`POST /classify` returns the passport JSON defined in `data/contract.md`** (the `DigitalProductPassport` above). Input is a garment descriptor (id + fiber composition + any known chemical history); output is the full passport with the embedded `Classification`.
- The return must equal the corresponding `passports/dpp_<garmentId>.json` **byte-for-byte at freeze time** (`data/contract.md` rule 5: frozen-model parity).

### 6.3 Keepalive cron
- Render free-tier services sleep on idle. Run a **keepalive cron** (GitHub Actions on a schedule, hitting `KEEPALIVE_TARGET_URL`, owned by you per `PLAN.md` secrets table) so the endpoint is warm for the judges. This is the APEX "keep-alive cron for judges" pattern. Provide an **unauthenticated liveness probe** that returns no sensitive data (a `/healthz` returning 200) so the cron does not need a key.

### 6.4 Frozen-model parity rule (the hard one)
- The deployed endpoint **must serve the exact model that produced `data/artifacts/v1.0.0`**, verified by manifest SHA (`PLAN.md` Shared Contracts: "Frozen model parity"; `data/contract.md` rule 5).
- Concretely: (1) train the model; (2) generate all `classifications.json` + `passports/*.json` from THAT model; (3) compute SHA-256 per file into `manifest.json` (`Manifest.modelVersions` carries e.g. `{ "engineC": "catboost-v1.0" }`); (4) ship the SAME serialized model artifact to Render; (5) on startup, the endpoint verifies its model file's SHA against the manifest entry and refuses to start on mismatch.
- This guarantees the live `/classify` of a demo garment returns exactly the pre-computed passport the frontend already has. **The demo never depends on a real-time model retrain** (`CLAUDE.md` §6 hard rule). The endpoint is a credibility signal (a real deployed product with a verifiable frozen model), not a live-compute dependency.
- Demo-safety corollary: if Render is unreachable on stage, the frontend still renders VIEW 2 entirely off the static `passports/*.json`. The endpoint proves the product is real; the static artifacts guarantee the demo runs offline.

---

## 7. Pitch-support pack (residency + Cox judges)

You own the numbers behind the "commercially deployable in Year 1" half of the pitch. All figures below are sourced from the Techno-Economic dossier and the IP/FTO analysis. Present with best/expected/worst bands and TRL labels. Never present a single point estimate to LCA-literate judges.

### 7.1 Techno-economic numbers (verified, from the Techno-Economic dossier)
- **Leverage story, not bulk tonnage:** the ~2-5% elastane that causes recyclers to reject a whole blended stretch garment strands the recyclable 95-98% (cotton/polyester). "Just 1% elastane is sufficient for the garment to be rejected at a recycling sorting plant" (Textiles Intelligence); ≥ 5% clogs shredders (TU Wien).
- **CO₂e avoided:** **~2 tonnes CO₂e avoided per tonne of blended stretch garment diverted** (range ~1.5-4 t, dominated by virgin-fiber displacement + avoided landfill/incineration). **~0.3 kg CO₂e per child's garment** (range 0.2-0.4). At scale, a 100,000 t/yr program ≈ ~200,000 t CO₂e/yr avoided + ~100,000 t waste diverted.
- **Why elastane matters:** virgin elastane is ~15-20 kg CO₂e/kg (a widely cited benchmark gives ~17 kg CO₂e/kg at 70 dtex; some sources cite ~20), among the most carbon-intensive mass-market fibers. (Caveat per the dossier: this is from secondary LCA benchmarks, not one primary peer-reviewed dataset, so triangulate before publishing a point value.)
- **Abatement cost:** **$50-200/t CO₂ expected**, best case negative (profitable recycling generating saleable fiber), worst case > $500/t. Benchmark: direct air capture ~$600-1,000/t by 2030. An expected < $200/t pathway with a co-product revenue stream is a strong cleantech number. (Caveat: modeled by analogy to NREL PET economics, not a REWEAR-FUSED-specific TEA, so label it illustrative early-stage. NREL/BOTTLE figures are PET, not elastane; elastane's carbamate chemistry needs different enzymes and likely thermal pretreatment, which raises process cost vs the PET base case.)
- **Enzyme cost is NOT the binding constraint:** NREL/BOTTLE's enzymatic-PET TEA shows recycled monomer reaching cost parity (recycled PET $1.51/kg vs $1.87/kg virgin, 2025 *Nature Chem Eng*); MSP is dominated by **solids loading and conversion yield**, not enzyme loading/cost (which moves MSP only ~5-9%).
- **Honesty check to keep in the pitch (Uekert 2022, *Green Chem.*):** as-modeled at TRL ~5, enzymatic hydrolysis can perform 1.2-17× worse than virgin until yields improve and amorphization pretreatment / pH control are eliminated. The carbon case rests on displaced virgin production + avoided EoL, NOT on the process being intrinsically clean. Stating this pre-empts the "hand-waving" critique.

### 7.2 SB 707 / EU EPR fee angle (near-term revenue before any plant exists)
- The Digital Recyclability Passport + recyclable-by-design elastane is a **fee-reduction / malus-avoidance compliance product with willingness-to-pay before recycling plants exist**, the asset-light wedge.
- **California SB 707:** producers must join Landbell USA by **1 July 2026**; eco-modulated fees with malus penalties target exactly the poly-cotton-elastane blends REWEAR-FUSED fixes; up to **$50,000/day** penalties; full implementation ~2030.
- **France Refashion (the worked example for the demo):** baseline eco-contribution averages "just under 4 centimes per item for 2024." A Carter's recycled-elastane onesie hitting the durability bonus (€0.07 or €0.70 reference × category factor) + the environmental-certification bonus (€0.30 or €0.03; eligible labels incl. OEKO-TEX MADE IN GREEN, GOTS, EU Ecolabel) + the recycled-material bonus (€500-€1,000/tonne) can earn **up to ~€1.00 vs the ~€0.04 baseline, a ~25× return per garment.** Refashion's own max example: "a T-shirt paying an eco-contribution of 2 centimes could receive up to a one-euro bonus."
- **Compliance-testing savings to price against:** per-SKU children's-apparel testing runs CPSIA panel $380-$3,000/SKU, full AAFA RSL $800-$2,500/SKU, ZDHC MRSL Level 1 $1,500-$4,000/formulation. A brand launching 500 SKUs/season faces **$0.5M-$2M/year** in chemical-compliance testing alone. Price the SaaS as a percentage of testing-cost savings + EPR-fee savings: "the only DPP platform that ships with a pre-encoded children's-apparel chemical-compliance brain, not just a data container."
- **DPP software market (cite ranges, scopes vary):** MarketsandMarkets $185.9M (2024) → $1,780.5M (2030) at 45.7% CAGR; The Business Research Company $1.35B (2025) → $5.64B (2030) at 33.3%. Comparable raises confirming the thesis: EON $20.5M total ($10M Series A), TrusTrace $30M ($24M Series B), Retraced €15M Series A, Worldly $54M total ($50M Series B).
- **Cox framing:** Cox led Nexus Circular's **$150M round (Jan 2023)**, became majority owner, and has surpassed **$3B in cleantech investment**. Nexus turns hard-to-recycle plastic into ISCC-PLUS-certified virgin-equivalent feedstock. **REWEAR-FUSED = "Nexus for stretch textiles"**: biological recycling of the blended feedstock pyrolysis can't cleanly address. (Market-timing note from the dossier: The LYCRA Company filed Chapter 11 on 17 March 2026: incumbent fragility = opportunity narrative, but also feedstock-supply uncertainty.)
- **Method-stack to cite (pre-empts the LCA critique):** ISO 14040/14044 + EU PEFCR Apparel & Footwear v3.1 (EC-welcomed 25 June 2025) + Higg MSI + WBCSD Avoided Emissions Guidance v2.0 (July 2025); model in SimaPro/OpenLCA on ecoinvent 3.10; report avoided emissions **separately** from Scope 1/2/3 per SBTi.

### 7.3 IP / FTO talking points (from the IP Landscape & FTO analysis)
- **The moat is the matched-pair co-design itself:** a system + method claim covering simultaneous creation of an enzymatically-cleavable aliphatic segmented PU-urea elastane AND a de-novo urethanase designed against that fiber's engineered cleavage site. **"Design the lock and the key together."** Every major incumbent (Carbios, Samsara Eco, Protein Evolution, Epoch Biodesign, Covestro/Greifswald) does the opposite, engineering enzymes to attack pre-existing commodity plastics. This appears to be genuine white space.
- **FTO is favorable but not unconditional.** The dangerous patents are sequence-specific composition-of-matter claims (Covestro WO2023194440A1 / US 12,351,853; the EP3587570A1 urethanase family) and Carbios's process claims (US 10,124,512). Design-arounds: (1) keep the de-novo enzyme's identity to UMG-SP2 and to Covestro SEQ ID NO:1-3 **well below claimed variant bands** (claims reach ±15%, i.e. ~85% identity; **target < 50%, ideally < 40%**; clear with FoldSeek/BLAST pre-filing); (2) avoid the specific claimed glycolysis-then-urethanase two-step process language; (3) ensure the cleavable fiber chemistry is distinct from US 6,221,997's amino-acid-chain-extender claims. The catalytic mechanism (Ser-His-Asp) is NOT patentable subject matter; only specific sequences and processes are.
- **The open-source design tools do not encumber ownership:** RFdiffusion2, LigandMPNN (MIT), Boltz-2, FoldSeek (GPL-3.0 for the tool, not the output) carry permissive licenses; none claims ownership of generated sequences/structures. REWEAR-FUSED can patent its de-novo enzyme. (Caveat: verify each model-weights license at filing; some weights carry separate, occasionally non-commercial terms.)
- **The provisional-filing path that satisfies Cox's "active progress toward securing IP":** File **Provisional #1 immediately** (co-design method + matched fiber+enzyme system). USPTO provisional filing fee is **as low as $60 (micro-entity) / $130 (small-entity)** (37 CFR 1.16(d), effective 19 Jan 2025); attorney prep adds ~$500-$1,500 basic. A provisional needs no formal claims. **Even a single $60-$130 provisional converts "an idea" into "active IP progress."** Then: FTO memo within 30-60 days against the named families; Provisional #2 (validated fiber + enzyme sequences) as data matures; convert to non-provisional + PCT within 12 months (priority: system → method → fiber → enzyme).
- **Engine C specifically should be DEFENSIVELY PUBLISHED, not patented.** The Digital Recyclability Passport layer largely implements the EU ESPR/DPP standard (Reg (EU) 2024/1781), so it is unlikely to be strongly patentable (it tracks a regulatory standard). Defensive publication (timestamped disclosure) blocks others from patenting it while avoiding wasted prosecution cost. **This is the right IP posture for your lane:** Engine C is the deployable compliance product and the standards-conformance story, NOT a patent asset. Frame it that way to the residency judge.
- **The three-layer moat to present:** (1) Paradigm moat, "we design the lock and the key together; incumbents only make keys for old locks"; (2) Filed-IP moat, a provisional/PCT on the system + method, enzyme and fiber as composition backstops; (3) FTO, de-novo enzyme below all claimed identity bands + novel fiber + distinct process = commercialize without licensing incumbents. (Caveat from the source: this used public Google Patents/USPTO/Espacenet snippets; a professional FTO search is required before relying on white-space conclusions for fundraising or filing.)

---

## 8. Your task checklist (maps to PLAN.md)

- **3.1 Data ETL** (`engine-c/ingest`, deps 0.4): ingest CPSC SaferProducts + EU Safety Gate + Toxic-Free Future/Peaslee PFAS + OEKO-TEX negatives + EPA CompTox/PubChem reference data into `data/datasets/`. No synthetic garments in the judged path.
- **3.2 Classifier** (`engine-c/classifier`, deps 3.1): deterministic rule layer over the ~85+ thresholds FIRST; CatBoost classifier-chain on the residual; ChemBERTa-2/MolFormer featurization; SHAP "why flagged"; isotonic calibration. Report PR-AUC ≥ 0.85 per label (and the REAL achieved number).
- **3.3 Passport** (`engine-c/passport`, deps 3.2): W3C VC 2.0 / UNTP JSON-LD + GS1 Digital Link URI + scannable QR + clear/lab-test/divert. Conform to `DigitalProductPassport` field-for-field. Emit `passports/dpp_<garmentId>.json`.
- **3.4 Live endpoint + keepalive** (`engine-c/api`, deps 3.2): FastAPI on Render; `POST /classify` returns the passport JSON byte-for-byte equal to the static artifact; `/healthz` liveness probe; keepalive cron via GitHub Actions; frozen-model SHA verification on startup.

Coordinate via `PLAN.md` (set 🟡 + name + timestamp, commit PLAN.md only, push, then work). Your lane owns `engine-c/` + `data/datasets/`. Contract changes (anything in the passport/classification shape) require a `⚠️ CONTRACT` prefix and a ping to Stephen + the frontend before committing; those shapes are the frontend's anti-drift surface.

---

*Questions on shapes go to Stephen (`data/contract.md` is authoritative). Questions on the enzyme/fiber matched-pair that the passport references go to Pravin. The passport's `aromaticAmineRelease: "NONE"` and the Ser-His-Asp / aliphatic-isocyanate story are locked Constraints (CLAUDE.md §2); never emit UI text or data that contradicts them.*
