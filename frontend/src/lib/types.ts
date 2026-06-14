/**
 * Canonical artifact types. The TypeScript mirror of /data/contract.md (v1.0.0).
 * Backend (Pravin), Engine C (Vinh), and the frontend mocks all conform to these.
 * The frontend reads pre-computed, signed artifacts; it never calls a live GPU job.
 * Changes here require a CONTRACT-prefixed commit and a ping to all consumers.
 */

export type Decision = "clear" | "lab-test" | "divert";
export type RegStatus = "PASS" | "FLAG" | "FAIL";

export interface FiberComponent {
  fiber: string;
  percent: number;
  source: string;
}

export interface Garment {
  id: string;
  name: string;
  archetype: "onesie" | "legging" | "sleeper" | "bodysuit" | "swim";
  imageUrl: string;
  fiberComposition: FiberComponent[];
  simulatedChemicalHistory?: string;
  inSilico: true;
}

export interface Regulation {
  id: string;
  name: string;
  jurisdiction: "US-Federal" | "US-CA" | "US-NY" | "US-ME" | "EU";
  limit: string;
  citation: string;
  effectiveDate: string;
}

export interface TriggeredRegulation {
  regulationId: string;
  status: RegStatus;
  measuredOrPredicted: "deterministic" | "predicted";
  detail: string;
}

export interface Classification {
  garmentId: string;
  decision: Decision;
  probability: number;
  prAuc: number;
  auc: number;
  triggeredRegulations: TriggeredRegulation[];
  compositionDrivers?: { feature: string; weight: number }[];
  inSilico: true;
  placeholder?: boolean;
}

export interface FiberCandidate {
  id: string;
  isocyanate: { name: string; type: "aliphatic"; pubchemCid: number };
  softSegment: { name: string; mwGramsPerMol: number };
  chainExtender: string;
  hardSegmentWtPct: number;
  predicted: {
    tgSoftC: number;
    tgHardC: number;
    elongationPct: number;
    modulusMPa: number;
    confidence: number;
  };
  accessibilityScore: number;
  carbamateSmarts: string;
  inSilico: true;
  placeholder?: boolean;
}

export interface Screening {
  enumeratedCount: number;
  scoredCount: number;
  filteredCount: number;
  topCandidateIds: string[];
}

export interface TradeoffCurve {
  x: number[];
  degradability: number[];
  mechanicalRetention: number[];
  designWindow: [number, number];
  citationNote: string;
}

export interface EnzymeDesign {
  id: string;
  matchedFiberId: string;
  catalyticTriad: "Ser-His-Asp";
  pHOptimum: [number, number];
  placer: {
    preorganizationFraction: number;
    plddt: number;
    plddtActiveSite: number;
    catalyticCaRmsd: number;
    scRmsd: number;
    uncertainty: number;
  };
  foldseekBestTM: number;
  foldseekBestHitPdb: string | null;
  noveltyVerdict: string;
  pdbPath: string;
  inSilico: true;
  placeholder?: boolean;
}

export interface MatchedPair {
  fiberId: string;
  enzymeId: string;
  enzyme_match: string;
  substrateSmiles: string;
  narrative: string;
}

export interface DigitalProductPassport {
  passportId: string;
  garmentId: string;
  gs1DigitalLinkUri: string;
  qrPayload: string;
  classification: Classification;
  aromaticAmineRelease: "NONE";
  credential: {
    type: ["VerifiableCredential", "DigitalProductPassport"];
    issuer: string;
    proof: { type: string; verificationMethod: string; signatureValue: string };
  };
  trl: "TRL 2-3";
  inSilico: true;
  placeholder?: boolean;
}

export interface Manifest {
  version: "1.0.0";
  generatedAt: string;
  files: { path: string; sha256: string; bytes: number; producedBy: string }[];
  modelVersions: Record<string, string>;
  issuer?: string;
}
