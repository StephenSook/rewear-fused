/**
 * Data layer. The ONE place the artifact source is chosen.
 *
 * Engine C (compliance: garments, regulations, classifications, passports) now
 * reads the REAL signed artifact bundle produced by `engine-c/classifier/build.py`
 * (trained on live CPSC recalls; no placeholders). Synced into ./artifacts via
 * `scripts/sync_artifacts_to_frontend.py`. The live endpoint serves the same
 * bytes (frozen-model parity). Engine A/B (fibers, enzymes) now read Pravin's REAL
 * RDKit-screen + LigandMPNN-redesign artifacts (synced into ./artifacts); the UI
 * labels them in-silico, and honestly as redesigns (TM ~0.8), not de-novo folds.
 */
import candidatesData from "./artifacts/candidates.json";
import screeningData from "./artifacts/screening.json";
import tradeoffData from "./artifacts/tradeoffCurve.json";
import designsData from "./artifacts/designs.json";
import pairsData from "./artifacts/topPairs.json";
import garmentsData from "./artifacts/garments.json";
import regulationsData from "./artifacts/regulations.json";
import classificationsData from "./artifacts/classifications.json";
import passportsData from "./artifacts/passports.json";
import type {
  Garment,
  Regulation,
  Classification,
  DigitalProductPassport,
  FiberCandidate,
  EnzymeDesign,
  MatchedPair,
  TradeoffCurve,
  Screening,
} from "./types";

// JSON imports widen literal types (true -> boolean, "clear" -> string), so the
// real bundle is asserted back to the contract interfaces it was generated to.
const garments = garmentsData as unknown as Garment[];
const regulations = regulationsData as unknown as Regulation[];
const classifications = classificationsData as unknown as Classification[];
const passports = passportsData as unknown as DigitalProductPassport[];

export function getGarments(): Garment[] {
  return garments;
}

export function getRegulation(id: string): Regulation | undefined {
  return regulations.find((r) => r.id === id);
}

export function getClassification(garmentId: string): Classification | undefined {
  return classifications.find((c) => c.garmentId === garmentId);
}

export function getPassport(garmentId: string): DigitalProductPassport | undefined {
  return passports.find((p) => p.garmentId === garmentId);
}

// Engine A/B now read Pravin's REAL artifacts (RDKit screen + LigandMPNN-redesign
// designs). Lead pair = enzyme-003 (best PLACER, a LigandMPNN redesign of CALB /
// PDB 1TCA so it matches the scaffold the viewer renders) with its matched fiber-008.
// JSON imports widen literals, so each is asserted back to its contract interface.
const candidates = candidatesData as unknown as FiberCandidate[];
const designs = designsData as unknown as EnzymeDesign[];
const pairs = pairsData as unknown as MatchedPair[];

const leadDesign = designs.find((d) => d.id === "enzyme-003") ?? designs[0]!;
const leadPair = pairs.find((p) => p.enzymeId === leadDesign.id) ?? pairs[0]!;
const leadFiber = candidates.find((c) => c.id === leadPair.fiberId) ?? candidates[0]!;

export const engineA = {
  candidate: leadFiber,
  tradeoff: tradeoffData as unknown as TradeoffCurve,
  screening: screeningData as unknown as Screening,
};

export const engineB = { design: leadDesign };
export const pair = leadPair;

// The CALB / PDB 1TCA serine-hydrolase scaffold the viewer renders: it is the real
// template the lead design (enzyme-003) is a LigandMPNN redesign of.
export const REFERENCE_PDB = "/pdb/reference-hydrolase-1tca.pdb";
// The real designed (redesigned) structure, offered as a download.
export const DESIGN_PDB = "/pdb/enzyme-003.bcif";
