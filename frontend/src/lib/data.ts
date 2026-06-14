/**
 * Data layer. The ONE place the artifact source is chosen.
 *
 * Engine C (compliance: garments, regulations, classifications, passports) now
 * reads the REAL signed artifact bundle produced by `engine-c/classifier/build.py`
 * (trained on live CPSC recalls; no placeholders). Synced into ./artifacts via
 * `scripts/sync_artifacts_to_frontend.py`. The live endpoint serves the same
 * bytes (frozen-model parity). Engine A/B (fibers, enzymes) stay on mock fixtures
 * until those GPU/RDKit pipelines run; the UI labels them in-silico.
 */
import * as mock from "./mock-data";
import garmentsData from "./artifacts/garments.json";
import regulationsData from "./artifacts/regulations.json";
import classificationsData from "./artifacts/classifications.json";
import passportsData from "./artifacts/passports.json";
import type {
  Garment,
  Regulation,
  Classification,
  DigitalProductPassport,
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

export const engineA = {
  candidate: mock.fiberCandidate,
  tradeoff: mock.tradeoffCurve,
  screening: mock.screening,
};

export const engineB = { design: mock.enzymeDesign };
export const pair = mock.matchedPair;

// The labeled reference serine-hydrolase scaffold (CALB, PDB 1TCA) the viewer
// renders until Engine B's designed structure lands at the artifact-freeze gate.
export const REFERENCE_PDB = "/pdb/reference-hydrolase-1tca.pdb";
