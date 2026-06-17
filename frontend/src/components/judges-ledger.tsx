"use client";

import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { BeveledBox, MonoLabel, InSilicoBadge } from "./instrument";
import { BeveledButton } from "./beveled-button";
import { Reveal, RevealGroup, RevealItem } from "./reveal";
import { cn } from "@/lib/cn";

type Tier = "WIRED LIVE" | "IN-SILICO" | "REAL DATA" | "FORWARD";

const TIER_STYLE: Record<Tier, string> = {
  "WIRED LIVE": "text-pass border-pass/40",
  "REAL DATA": "text-pass border-pass/40",
  "IN-SILICO": "text-warn border-warn/40",
  FORWARD: "text-fg-muted border-rule",
};

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={cn(
        "inline-block shrink-0 border px-2.5 py-1 font-mono text-[0.6rem] tracking-widest uppercase",
        TIER_STYLE[tier],
      )}
    >
      {tier}
    </span>
  );
}

type Item = { name: string; tier: Tier; trl?: string; detail: string; proof?: { href: string; label: string } };

const ITEMS: Item[] = [
  {
    name: "Engine C: Digital Recyclability Passport",
    tier: "WIRED LIVE",
    trl: "TRL 6",
    detail:
      "A real FastAPI endpoint and a deployed UI. Deterministic rules over real US/EU thresholds plus a classifier, emitting a scannable GS1 Digital Link passport. The product Carter's could deploy in Year 1. Click the link, it works.",
    proof: { href: "/passport", label: "Open the live passport" },
  },
  {
    name: "The application (5 views)",
    tier: "WIRED LIVE",
    detail:
      "Deployed on Vercel, reading the signed artifact bundle through real rendering code. Mol* renders a real PDB; the passport QR is a GS1 Digital Link that resolves through our own resolver to the live passport. No hardcoded backend, no faked screens.",
    proof: { href: "/enzyme", label: "See the live Mol* structure" },
  },
  {
    name: "Training + reference data",
    tier: "REAL DATA",
    detail:
      "631 real CPSC product recalls (saferproducts.gov), pulled live and labeled: the wired training source today. The extension sources (EU Safety Gate, Toxic-Free Future / Peaslee PFAS, OEKO-TEX negatives) are Engine C's roadmap, not yet ingested. Garment archetypes use real published compositions; the garment images are illustrative, not specific product photos.",
  },
  {
    name: "Engine A: Cleavable elastane",
    tier: "IN-SILICO",
    trl: "TRL 3",
    detail:
      "Constraint-guided virtual screening over published monomers (aliphatic isocyanates only; cleavable bond in the amorphous soft segment; 25-35 wt% hard). Property predictions carry benchmark-referenced confidence. This is a designed candidate, not a spun fiber.",
  },
  {
    name: "Engine B: Carbamate hydrolase (LigandMPNN redesign)",
    tier: "IN-SILICO",
    trl: "TRL 2",
    detail:
      "The de-novo target (a no-prior-art carbamate hydrolase) needs a GPU run we deferred; the design fallback is three LigandMPNN redesigns of real serine-hydrolase scaffolds (IsPETase / FAST-PETase / CalB, TM ~0.8 to template) with in-silico PLACER preorganization targets on the Lauko thresholds. The viewer renders, and offers for download, the CALB / 1TCA reference scaffold the lead design is built on. In-silico design, not an expressed protein.",
  },
  {
    name: "Wet-lab validation",
    tier: "FORWARD",
    detail:
      "Not done: this is an in-silico design (TRL 2-3), not an expressed protein or spun fiber. The ask: express the top enzyme designs and spin a fiber sample, prove activity on a carbamate surrogate, file a provisional, and pilot one Carter's SKU. That is what the residency funds.",
  },
];

export function JudgesLedger() {
  return (
    <>
      <Reveal className="mb-10">
        <MonoLabel>For the judges</MonoLabel>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
          What is real, what is in-silico
        </h1>
        <p className="mt-4 max-w-2xl text-fg-muted">
          Everything REWEAR-FUSED produces is an in-silico design with
          benchmark-referenced metrics, not a wet-lab-validated material or enzyme.
          Here is exactly what is wired live, what is designed in-silico, and what is
          forward work. We would rather you check than take our word.
        </p>
      </Reveal>

      <RevealGroup className="space-y-4" stagger={0.07}>
        {ITEMS.map((it) => (
          <RevealItem key={it.name}>
            <BeveledBox className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl leading-tight">{it.name}</h2>
                  {it.trl && <span className="mono-label mt-1 inline-block">{it.trl}</span>}
                </div>
                <TierBadge tier={it.tier} />
              </div>
              <p className="mt-3 text-sm text-fg-muted">{it.detail}</p>
              {it.proof && (
                <div className="mt-4">
                  <BeveledButton href={it.proof.href} accent="bio">
                    {it.proof.label}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </BeveledButton>
                </div>
              )}
            </BeveledBox>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal className="mt-8" delay={0.05}>
        <BeveledBox accent="bio" className="p-6">
          <MonoLabel>The honesty moat</MonoLabel>
          <p className="mt-3 text-sm">
            Every number on this site is a live pipeline output (Engine C), a verified
            DOI, or a clearly-labeled in-silico design value (Engines A/B). No fabricated citations.
            No synthetic data in the judged path. No fictional persona. Engine C runs
            live on real CPSC data and is SHA-256 signed; Engine A/B are in-silico
            designs whose stand-in metrics are labeled as such until the pipelines run.
          </p>
          <div className="mt-4">
            <InSilicoBadge />
          </div>
        </BeveledBox>
      </Reveal>
    </>
  );
}
