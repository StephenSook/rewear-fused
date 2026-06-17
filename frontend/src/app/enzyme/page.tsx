import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { MonoLabel } from "@/components/instrument";
import { EnzymeStage } from "@/components/enzyme-stage";
import { EnzymeDetail } from "@/components/enzyme-detail";
import { MatchedPairStage } from "@/components/matched-pair-stage";
import { Reveal } from "@/components/reveal";
import { REFERENCE_PDB } from "@/lib/data";

export const metadata = {
  title: "Carbamate Hydrolase, Designed · REWEAR-FUSED",
};

export default function EnzymePage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
      <Link
        href="/passport"
        className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Passport
      </Link>

      <Reveal>
        <header className="mt-6 mb-8">
          <MonoLabel>Engine B · LigandMPNN redesign · de-novo run deferred</MonoLabel>
          <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
            A Designed Carbamate Hydrolase
          </h1>
          <p className="mt-4 max-w-2xl text-fg-muted">
            Our swing is a de-novo carbamate hydrolase with no prior art; that GPU
            run is deferred. What we designed in-silico is the LigandMPNN-redesign
            fallback: a known serine-hydrolase scaffold with its Ser-His-Asp triad
            repositioned for carbamate hydrolysis at near-neutral pH. An in-silico
            design, honestly a redesign, not a de-novo fold.
          </p>
        </header>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Reveal delay={0.05}>
          <EnzymeStage url={REFERENCE_PDB} activeSite={[105, 187, 224]} chain="A" />
          <p className="mt-3 font-mono text-[0.65rem] text-fg-muted">
            The CALB / PDB 1TCA serine-hydrolase scaffold our lead design
            (enzyme-003) is a LigandMPNN redesign of; its Ser-His-Asp catalytic triad
            (Ser105 / His224 / Asp187) is highlighted in green. This reference
            scaffold is downloadable in the readout. Drag to rotate.
          </p>
        </Reveal>

        <EnzymeDetail />
      </div>

      <Reveal delay={0.05}>
        <section className="mt-16">
          <MonoLabel>The matched pair · substrate handoff</MonoLabel>
          <div className="mt-3">
            <MatchedPairStage />
          </div>
          <p className="mt-3 max-w-2xl font-mono text-[0.65rem] leading-relaxed text-fg-muted">
            One inverse-design problem, two coupled molecules. The amber fiber&apos;s carbamate
            is the exact bond the green enzyme is built to cut: the substrate detaches, docks into
            the Ser-His-Asp pocket, the bond cleaves to recoverable monomers, and the two accents
            fuse at the cut. Proof it is one loop, not two projects.
          </p>
        </section>
      </Reveal>

      <div className="mt-12 flex justify-end">
        <Link
          href="/passport"
          className="group inline-flex items-center gap-3 font-mono text-xs tracking-widest uppercase text-accent-bio"
        >
          Back to the passport
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </main>
  );
}
