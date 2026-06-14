/**
 * Engine A / B mock fixtures for the molecular views (fiber, enzyme, loop),
 * conforming to /data/contract.md. These render the views until Pravin's real
 * RDKit / GPU artifacts replace them at the artifact-freeze gate (identical
 * shapes, no UI change). Pipeline-derived numbers carry placeholder:true and are
 * surfaced as in-silico in the UI.
 *
 * Engine C compliance data is NO LONGER mocked: the frontend reads the real,
 * signed artifact bundle (lib/artifacts/) through lib/data.ts.
 */
import type {
  FiberCandidate,
  EnzymeDesign,
  MatchedPair,
  TradeoffCurve,
  Screening,
} from "./types";

export const fiberCandidate: FiberCandidate = {
  id: "fiber-001",
  isocyanate: { name: "H12MDI", type: "aliphatic", pubchemCid: 16156 },
  softSegment: { name: "PCL-diol", mwGramsPerMol: 2000 },
  chainExtender: "BDO",
  hardSegmentWtPct: 30,
  predicted: { tgSoftC: -60, tgHardC: 165, elongationPct: 520, modulusMPa: 42, confidence: 0.78 },
  accessibilityScore: 0.71,
  carbamateSmarts: "[#6]-NH-C(=O)-O-[#6]",
  inSilico: true,
  placeholder: true,
};

export const enzymeDesign: EnzymeDesign = {
  id: "enzyme-001",
  matchedFiberId: "fiber-001",
  catalyticTriad: "Ser-His-Asp",
  pHOptimum: [7.0, 8.5],
  placer: {
    preorganizationFraction: 0.67,
    plddt: 84,
    plddtActiveSite: 91,
    catalyticCaRmsd: 0.8,
    scRmsd: 1.6,
    uncertainty: 0.06,
  },
  foldseekBestTM: 0.41,
  foldseekBestHitPdb: null,
  noveltyVerdict: "no close structural match in PDB (TM-score < 0.5), de novo fold",
  // forward-looking: the viewer renders the labeled reference scaffold today;
  // this path is populated + consumed once Engine B's real .bcif lands at freeze
  pdbPath: "pdb/enzyme-001.bcif",
  inSilico: true,
  placeholder: true,
};

export const matchedPair: MatchedPair = {
  fiberId: "fiber-001",
  enzymeId: "enzyme-001",
  enzyme_match: "designed against fiber-001 carbamate microenvironment",
  substrateSmiles: "O=C(NC1CCCCC1)OCCCC",
  narrative: "The enzyme's Ser-His-Asp triad is shaped to the exact carbamate of the designed fiber.",
};

export const tradeoffCurve: TradeoffCurve = {
  x: [10, 15, 20, 25, 30, 35, 40, 45],
  degradability: [0.95, 0.9, 0.78, 0.62, 0.48, 0.34, 0.18, 0.08],
  mechanicalRetention: [0.2, 0.32, 0.5, 0.68, 0.82, 0.9, 0.95, 0.97],
  designWindow: [25, 35],
  citationNote: "Design window per Xu SusMat 2026 and Qin Adv. Sci. 2024.",
};

export const screening: Screening = {
  enumeratedCount: 12480,
  scoredCount: 3120,
  filteredCount: 47,
  topCandidateIds: ["fiber-001"],
};
