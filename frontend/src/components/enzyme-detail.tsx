"use client";

import { DownloadSimple, Check } from "@phosphor-icons/react/dist/ssr";
import { BeveledBox, MonoLabel, InSilicoBadge } from "./instrument";
import { InstrumentButton } from "./instrument-button";
import { RevealGroup, RevealItem } from "./reveal";
import { engineB, pair, DESIGN_PDB } from "@/lib/data";

function Metric({
  label,
  value,
  pass,
  threshold,
}: {
  label: string;
  value: string;
  pass?: boolean;
  threshold?: string;
}) {
  return (
    <div className="border-b border-rule/50 pb-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="mono-label">{label}</span>
        <span className="font-mono text-sm tabular-nums">{value}</span>
      </div>
      {threshold && (
        <div className="mt-1 flex items-center gap-1.5 font-mono text-[0.6rem] text-fg-muted">
          {pass && <Check weight="bold" className="h-3 w-3 text-pass" />}
          {threshold}
        </div>
      )}
    </div>
  );
}

/** The Engine B evidence column, revealed as a staggered instrument readout. */
export function EnzymeDetail() {
  const d = engineB.design;
  return (
    <RevealGroup className="space-y-5" stagger={0.08}>
      <RevealItem>
        <BeveledBox accent="bio" className="p-5">
          <MonoLabel>Catalytic triad</MonoLabel>
          <p className="mt-2 font-display text-xl">{d.catalyticTriad}</p>
          <p className="mt-1 text-sm text-fg-muted">
            engineered, near-neutral pH {d.pHOptimum[0].toFixed(1)} to{" "}
            {d.pHOptimum[1].toFixed(1)}, cotton-compatible
          </p>
        </BeveledBox>
      </RevealItem>

      <RevealItem>
        <BeveledBox className="p-5">
          <div className="flex items-baseline justify-between">
            <MonoLabel>PLACER preorganization</MonoLabel>
            <span className="font-mono text-2xl tabular-nums text-accent-bio">
              {d.placer.preorganizationFraction.toFixed(2)}
              <span className="text-sm text-fg-muted"> ± {d.placer.uncertainty.toFixed(2)}</span>
            </span>
          </div>
          <p className="mt-2 font-mono text-[0.6rem] leading-relaxed text-fg-muted">
            Real PLACER metrics for the LigandMPNN redesign, on the Lauko
            thresholds. In-silico, not an expressed protein.
          </p>
          <div className="mt-4 space-y-2">
            <Metric
              label="pLDDT (protein)"
              value={String(d.placer.plddt)}
              pass={d.placer.plddt > 80}
              threshold="Lauko: > 80"
            />
            <Metric
              label="pLDDT (active site)"
              value={String(d.placer.plddtActiveSite)}
              pass={d.placer.plddtActiveSite > 90}
              threshold="Lauko: > 90"
            />
            <Metric
              label="catalytic Cα RMSD"
              value={`${d.placer.catalyticCaRmsd.toFixed(1)} Å`}
              pass={d.placer.catalyticCaRmsd < 1.0}
              threshold="Lauko: < 1.0 Å"
            />
            <Metric
              label="self-consistency RMSD"
              value={`${d.placer.scRmsd.toFixed(1)} Å`}
              pass={d.placer.scRmsd < 2.0}
              threshold="Lauko: < 2.0 Å"
            />
          </div>
        </BeveledBox>
      </RevealItem>

      <RevealItem>
        <BeveledBox className="p-5">
          <MonoLabel>FoldSeek novelty</MonoLabel>
          <p className="mt-2 text-sm">{d.noveltyVerdict}</p>
          <p className="mt-1 font-mono text-[0.65rem] text-fg-muted">
            best TM-score {d.foldseekBestTM.toFixed(2)}
          </p>
        </BeveledBox>
      </RevealItem>

      <RevealItem>
        <BeveledBox accent="fiber" className="p-5">
          <MonoLabel>Matched pair</MonoLabel>
          <p className="mt-2 text-sm">{pair.narrative}</p>
          <p className="mt-1 font-mono text-[0.65rem] text-fg-muted">{pair.enzyme_match}</p>
        </BeveledBox>
      </RevealItem>

      <RevealItem>
        <div className="flex flex-wrap items-center gap-3">
          <InstrumentButton href={DESIGN_PDB} accent="bio" download stream>
            <DownloadSimple className="h-4 w-4" /> Designed structure (enzyme-003) .bcif
          </InstrumentButton>
          <InSilicoBadge />
        </div>
      </RevealItem>
    </RevealGroup>
  );
}
