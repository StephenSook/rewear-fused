import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "@phosphor-icons/react/dist/ssr";
import { BeveledBox, MonoLabel, InSilicoBadge } from "@/components/instrument";
import { ScreeningFunnel } from "@/components/screening-funnel";
import { TradeoffCurve } from "@/components/tradeoff-curve";
import { FiberStage } from "@/components/fiber-stage";
import { Reveal } from "@/components/reveal";
import { engineA, pair } from "@/lib/data";

export const metadata = {
  title: "Cleavable Elastane Design · REWEAR-FUSED",
};

function Spec({
  label,
  value,
  ok,
  window: win,
}: {
  label: string;
  value: string;
  ok?: boolean;
  window?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-rule/50 pb-2">
      <span className="mono-label">{label}</span>
      <span className="flex items-center gap-1.5 font-mono text-sm tabular-nums">
        {ok && <Check weight="bold" className="h-3 w-3 text-pass" />}
        {value}
        {win && <span className="text-[0.6rem] text-fg-muted">{win}</span>}
      </span>
    </div>
  );
}

export default function FiberPage() {
  const c = engineA.candidate;
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
      <Link
        href="/passport"
        className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Passport
      </Link>

      <Reveal>
        <header className="mt-6 mb-10">
          <MonoLabel>Engine A · constraint-guided screening</MonoLabel>
          <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
            Cleavable Elastane Design
          </h1>
          <p className="mt-4 max-w-2xl text-fg-muted">
            We do not invent a polymer. We enumerate compositions of published
            monomers, score them with property predictors, and filter against hard
            constraints. The winner emits its carbamate microenvironment as the
            enzyme&apos;s substrate target.
          </p>
        </header>
      </Reveal>

      {/* funnel + candidate, no 3D here */}
      <Reveal delay={0.05}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <MonoLabel>01 · Screening funnel</MonoLabel>
            <div className="mt-3">
              <ScreeningFunnel />
            </div>
          </div>
          <div>
            <MonoLabel>02 · Top candidate {c.id}</MonoLabel>
            <BeveledBox accent="fiber" className="mt-3 p-5">
              <div className="space-y-2">
                <Spec label="isocyanate" value={`${c.isocyanate.name} (aliphatic)`} ok />
                <Spec label="PubChem CID" value={String(c.isocyanate.pubchemCid)} />
                <Spec label="soft segment" value={`${c.softSegment.name} ${c.softSegment.mwGramsPerMol} g/mol`} />
                <Spec label="chain extender" value={c.chainExtender} />
                <Spec label="hard segment" value={`${c.hardSegmentWtPct} wt%`} ok window="25-35" />
                <Spec label="Tg soft" value={`${c.predicted.tgSoftC} °C`} ok={c.predicted.tgSoftC < -50} window="< -50" />
                <Spec label="Tg hard" value={`${c.predicted.tgHardC} °C`} ok={c.predicted.tgHardC > 150} window="> 150" />
                <Spec label="elongation" value={`${c.predicted.elongationPct}%`} ok={c.predicted.elongationPct >= 400} window=">= 400" />
                <Spec label="accessibility" value={c.accessibilityScore.toFixed(2)} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-mono text-[0.65rem] text-fg-muted">{c.carbamateSmarts}</span>
                <InSilicoBadge />
              </div>
            </BeveledBox>
          </div>
        </div>
      </Reveal>

      {/* the 3D moment, its own viewport */}
      <Reveal delay={0.05}>
        <section className="mt-16">
          <MonoLabel>03 · Fiber architecture</MonoLabel>
          <div className="mt-3">
            <FiberStage />
          </div>
          <p className="mt-3 font-mono text-[0.65rem] text-fg-muted">
            Crystalline hard segments (amber) stay intact and load-bearing. The
            cleavable carbamate bond (green) lives in the amorphous soft segment, so
            the enzyme reaches it without destroying the stretch. Drag to rotate.
          </p>
        </section>
      </Reveal>

      {/* the honesty centerpiece, its own viewport */}
      <Reveal delay={0.05}>
        <section className="mt-16">
          <MonoLabel>04 · Mechanics vs cleavability</MonoLabel>
          <div className="mt-3 flex flex-wrap gap-5">
            <span className="flex items-center gap-2 font-mono text-xs">
              <span className="h-2 w-4 bg-accent-bio" /> degradability
            </span>
            <span className="flex items-center gap-2 font-mono text-xs">
              <span className="h-2 w-4 bg-accent-fiber" /> mechanical retention
            </span>
          </div>
          <BeveledBox tilt={false} className="mt-3 p-4">
            <TradeoffCurve />
          </BeveledBox>
          <p className="mt-3 font-mono text-[0.65rem] text-fg-muted">
            {engineA.tradeoff.citationNote}
          </p>
        </section>
      </Reveal>

      {/* the handoff: the fusion point */}
      <Reveal delay={0.05}>
        <section className="mt-16">
          <Link href="/enzyme" className="group block">
            <BeveledBox accent="bio" press className="flex items-center justify-between gap-4 p-6">
              <div>
                <MonoLabel>Substrate handoff</MonoLabel>
                <p className="mt-2 text-sm">{pair.narrative}</p>
                <p className="mt-1 font-mono text-[0.65rem] text-fg-muted">{pair.substrateSmiles}</p>
              </div>
              <span className="flex items-center gap-3 font-mono text-xs tracking-widest uppercase text-accent-bio">
                Engine B
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </BeveledBox>
          </Link>
        </section>
      </Reveal>
    </main>
  );
}
