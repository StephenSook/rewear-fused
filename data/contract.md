# Data Contract (v1.0.0) — the single anti-drift surface

**Owner: Stephen. Consumers: Pravin (backend outputs), Vinh (Engine C outputs), frontend (mocks + live render).**

This file defines the EXACT shapes of every artifact the frontend reads. Backend pipeline outputs, Engine C outputs, and the frontend mock fixtures all conform to these shapes. The frontend never depends on a live GPU job; it reads these pre-computed, signed artifacts. Engine C additionally serves the passport shape from a live endpoint.

Changes here require a `⚠️ CONTRACT` commit prefix and a ping to every consumer in `PLAN.md`. Do not invent fields. Do not invent numbers; every value is a real pipeline output or a clearly-marked placeholder (`"placeholder": true`).

## Folder layout

```
data/artifacts/v1.0.0/
  enzymes/designs.json
  fibers/candidates.json
  fibers/screening.json
  fibers/tradeoffCurve.json
  pairs/topPairs.json
  garments.json
  compliance/classifications.json
  compliance/regulations.json
  passports/dpp_<garmentId>.json
  pdb/<enzymeId>.bcif        # binary CIF, Mol*-ready (pre-converted from .pdb)
  manifest.json              # SHA-256 per file + provenance
```

All `inSilico: true`. All numeric predictions carry a confidence or interval. `null` is allowed where a value is genuinely not computed yet (frontend renders "pending"), but a fabricated number is never allowed.

## Shapes (TypeScript interfaces are the source of truth)

```ts
// ---- garments/garments.json ----
export interface Garment {
  id: string;                       // "carters-onesie-0-3m"
  name: string;                     // "Carter's Cotton-Blend Onesie, 0-3M"
  archetype: "onesie" | "legging" | "sleeper" | "bodysuit" | "swim";
  imageUrl: string;                 // real product archetype still
  fiberComposition: { fiber: string; percent: number; source: string }[]; // real published %
  simulatedChemicalHistory?: string; // optional context label, never presented as measured
  inSilico: true;
}

// ---- compliance/regulations.json (catalog) ----
export interface Regulation {
  id: string;                       // "CPSIA_LEAD_SUBSTRATE"
  name: string;                     // "CPSIA lead (substrate)"
  jurisdiction: "US-Federal" | "US-CA" | "US-NY" | "US-ME" | "EU";
  limit: string;                    // "100 ppm"
  citation: string;                 // human-readable statute ref
  effectiveDate: string;            // ISO date
}

// ---- compliance/classifications.json ----
export type Decision = "clear" | "lab-test" | "divert";
export interface Classification {
  garmentId: string;
  decision: Decision;
  probability: number;              // 0..1; model-calibrated for ML-driven rows, a rule-confidence value for deterministic-driven rows
  prAuc: number;                    // model PR-AUC for the driving label
  auc: number;                      // reported alongside, secondary
  triggeredRegulations: {
    regulationId: string;
    status: "PASS" | "FLAG" | "FAIL";
    measuredOrPredicted: "deterministic" | "predicted";
    detail: string;                 // e.g. "lead 12 ppm < 100 ppm"
  }[];
  compositionDrivers?: { feature: string; weight: number }[]; // composition ratios behind the decision (NOT SHAP; Engine C may add real SHAP later)
  inSilico: true;
}

// ---- fibers/candidates.json (Engine A) ----
export interface FiberCandidate {
  id: string;                       // "fiber-001"
  isocyanate: { name: string; type: "aliphatic"; pubchemCid: number }; // ALWAYS aliphatic
  softSegment: { name: string; mwGramsPerMol: number };                // PCL / polycarbonate ~2000
  chainExtender: string;            // BDO / EDA
  hardSegmentWtPct: number;         // 25..35
  predicted: {
    tgSoftC: number; tgHardC: number; elongationPct: number; modulusMPa: number;
    confidence: number;             // 0..1
  };
  accessibilityScore: number;       // carbamate enzymatic accessibility, 0..1
  carbamateSmarts: string;          // "[R]-NH-C(=O)-O-[R']"
  inSilico: true;
}

// ---- fibers/screening.json (the funnel) ----
export interface Screening {
  enumeratedCount: number; scoredCount: number; filteredCount: number;
  topCandidateIds: string[];
}

// ---- fibers/tradeoffCurve.json (the honesty centerpiece) ----
export interface TradeoffCurve {
  x: number[];                      // hard-segment wt%
  degradability: number[];          // 0..1
  mechanicalRetention: number[];    // 0..1
  designWindow: [number, number];   // [25, 35]
  citationNote: string;             // verified DOI caption
}

// ---- enzymes/designs.json (Engine B) ----
export interface EnzymeDesign {
  id: string;                       // "enzyme-001"
  matchedFiberId: string;           // cross-reference into fibers
  catalyticTriad: "Ser-His-Asp";    // engineered, near-neutral pH
  pHOptimum: [number, number];      // [7.0, 8.5]
  placer: {
    preorganizationFraction: number; // headline metric
    plddt: number;                   // protein
    plddtActiveSite: number;         // active site
    catalyticCaRmsd: number;         // < 1.0 A target
    scRmsd: number;                  // < 2.0 A target
    uncertainty: number;             // +/- band on preorganizationFraction
  };
  foldseekBestTM: number;           // de-novo target < 0.5; DELIVERED artifacts are LigandMPNN redesigns (TM ~0.8 to template), de-novo TM<0.5 is the deferred GPU swing
  foldseekBestHitPdb: string | null;
  noveltyVerdict: string;           // delivered: "redesign-not-de-novo: ... TM ~0.8 to template" (a de-novo result would read "no close structural match in PDB (TM < 0.5)")
  pdbPath: string;                  // "pdb/enzyme-001.bcif"
  inSilico: true;
}

// ---- pairs/topPairs.json (proof it is one loop) ----
export interface MatchedPair {
  fiberId: string;
  enzymeId: string;
  enzyme_match: string;             // the linkage label shown on the handoff arrow
  substrateSmiles: string;
  narrative: string;                // one sentence for the demo
}

// ---- passports/dpp_<garmentId>.json (Engine C, also the live endpoint return) ----
export interface DigitalProductPassport {
  passportId: string;               // GS1 Digital Link style
  garmentId: string;
  gs1DigitalLinkUri: string;        // "https://id.gs1.org/01/<gtin>/21/<serial>"
  qrPayload: string;                // same URI, encoded into the scannable QR
  classification: Classification;   // embeds the Engine C decision
  aromaticAmineRelease: "NONE";     // Constraint 1 green check (aliphatic design)
  credential: {                     // W3C VC 2.0 under UNTP context
    type: ["VerifiableCredential", "DigitalProductPassport"];
    issuer: string;                 // did:key:... (self-issued; Engine C emits a real Ed25519 did:key)
    proof: { type: string; verificationMethod: string; signatureValue: string };
  };
  trl: "TRL 2-3";
  inSilico: true;
}

// ---- manifest.json ----
export interface Manifest {
  version: "1.0.0";
  generatedAt: string;              // ISO; stamped by the pipeline, not the frontend
  files: { path: string; sha256: string; bytes: number; producedBy: string }[];
  modelVersions: Record<string, string>; // e.g. { "engineC": "catboost-v1.0", "rfdiffusion": "3" }
  issuer?: string;                  // did:key of the bundle signer (Engine C)
  // Frozen-model parity anchor (Engine C): the SHA the live endpoint verifies on
  // startup and refuses to boot on mismatch. kind "output" = served-output parity.
  frozenParity?: { kind: "output"; path: string; sha256: string; note: string };
}
```

## Rules of conformance

1. Every artifact file carries `inSilico: true` (or `trl`).
2. Engine A `isocyanate.type` is ALWAYS `"aliphatic"`. A fiber with an aromatic isocyanate is a contract violation (Constraint 1).
3. Engine B `catalyticTriad` is ALWAYS `"Ser-His-Asp"` with `pHOptimum` in the 7.0-8.5 band (Constraint 2).
4. `pairs/topPairs.json` MUST reference ids that exist in `enzymes/designs.json` and `fibers/candidates.json`.
5. The live Engine C endpoint return EQUALS the corresponding `passports/dpp_<garmentId>.json` byte-for-byte at freeze time (frozen-model parity).
6. Placeholders during early build: set the numeric field to a plausible mock AND add `"placeholder": true` at the object root so the frontend can badge it. Remove all placeholders by the artifact-freeze gate.
