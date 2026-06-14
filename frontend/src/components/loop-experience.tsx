"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, X, Recycle } from "@phosphor-icons/react/dist/ssr";
import { BeveledBox, MonoLabel, InSilicoBadge } from "./instrument";
import { InstrumentButton } from "./instrument-button";
import { Reveal } from "./reveal";
import { loopProgress } from "./loop-progress";
import { audioEngine } from "@/lib/audio-engine";
import { cn } from "@/lib/cn";
import { SceneBoundary } from "./scene-boundary";

const ParticleStorm = dynamic(() => import("./particle-storm"), { ssr: false });

const PHASES = [
  "Today's onesie",
  "Recovered fiber",
  "Carbamate cleavage",
  "Monomers",
  "Re-spun: a new onesie",
];

/** Instrument stepper: the five loop stages, the active one lit, a baseline
 *  fill tracking the scroll-driven loop progress (ref-written, no re-render). */
function LoopStepper({ phase }: { phase: number }) {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let last = -1;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const v = loopProgress.value;
      if (v === last) return; // only write when the scroll-driven value changed
      last = v;
      const el = fillRef.current;
      if (el) el.style.transform = `scaleX(${v})`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="mt-10 w-full max-w-xl">
      <div className="relative h-px w-full bg-rule">
        <div
          ref={fillRef}
          className="absolute inset-0 h-px origin-left bg-accent-bio"
          style={{
            transform: "scaleX(0)",
            boxShadow: "0 0 8px color-mix(in oklch, var(--color-accent-bio) 70%, transparent)",
          }}
        />
      </div>
      <div className="mt-3 flex justify-between gap-1">
        {PHASES.map((label, i) => {
          const active = i === phase;
          const done = i < phase;
          const cleave = i === 2 && active;
          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full transition-colors duration-300",
                  cleave
                    ? "bg-fg"
                    : active
                      ? "bg-accent-bio"
                      : done
                        ? "bg-accent-bio/50"
                        : "bg-fg-muted/40",
                )}
              />
              <span
                className={cn(
                  "text-center font-mono text-[0.55rem] uppercase tracking-wider transition-colors duration-300",
                  active ? "text-fg" : "text-fg-muted/60",
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LoopExperience() {
  const spacerRef = useRef<HTMLDivElement>(null);
  const lastPhase = useRef(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = spacerRef.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), Math.max(total, 1));
      const p = total > 0 ? scrolled / total : 0;
      loopProgress.value = p;
      const idx = p < 0.18 ? 0 : p < 0.4 ? 1 : p < 0.52 ? 2 : p < 0.72 ? 3 : 4;
      if (idx === 2 && lastPhase.current !== 2) audioEngine.cleavage();
      lastPhase.current = idx;
      setPhase((prev) => (prev === idx ? prev : idx));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <SceneBoundary fallback={null}>
        <ParticleStorm />
      </SceneBoundary>

      <div className="relative z-10">
        <Link
          href="/passport"
          className="absolute left-6 top-6 z-10 inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" /> Passport
        </Link>

        {/* the storm: a transparent tall spacer the canvas shows through */}
        <section ref={spacerRef} className="relative h-[340vh]">
          <div className="pointer-events-none sticky top-0 flex h-screen flex-col items-center justify-center px-6 text-center">
            <MonoLabel>The closed loop</MonoLabel>
            <motion.h2
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className={cn(
                "mt-4 font-display text-4xl sm:text-6xl transition-colors",
                phase === 2 && "text-fg drop-shadow-[0_0_24px_color-mix(in_oklch,var(--color-accent-bio)_55%,transparent)]",
              )}
            >
              {PHASES[phase]}
            </motion.h2>
            <LoopStepper phase={phase} />
            <p className="mono-label mt-6">scroll to drive the loop</p>
          </div>
        </section>

        {/* solid sections occlude the fixed canvas below */}
        <section className="relative bg-bg px-6 py-24">
          <Reveal className="mx-auto max-w-5xl">
            <MonoLabel>Two end-of-life fates</MonoLabel>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <BeveledBox className="p-6">
                <div className="flex items-center gap-2 text-fail">
                  <X weight="bold" className="h-5 w-5" />
                  <span className="font-mono text-xs tracking-widest uppercase">Today</span>
                </div>
                <ol className="mt-4 space-y-2 font-mono text-sm text-fg-muted">
                  <li>worn garment</li>
                  <li>shredder</li>
                  <li>insulation and pet bedding</li>
                  <li className="text-fail">dead end, downcycled</li>
                </ol>
              </BeveledBox>
              <BeveledBox accent="bio" className="p-6">
                <div className="flex items-center gap-2 text-accent-bio">
                  <Recycle weight="bold" className="h-5 w-5" />
                  <span className="font-mono text-xs tracking-widest uppercase">REWEAR-FUSED</span>
                </div>
                <ol className="mt-4 space-y-2 font-mono text-sm">
                  <li>worn garment</li>
                  <li>enzymatic depolymerization</li>
                  <li>recovered monomers, re-spun</li>
                  <li className="text-accent-bio">a new onesie, closed loop</li>
                </ol>
              </BeveledBox>
            </div>
          </Reveal>
        </section>

        <section className="relative bg-bg px-6 pb-24">
          <Reveal className="mx-auto max-w-5xl">
            <BeveledBox accent="fiber" className="p-6">
              <MonoLabel>Microplastics, reframed</MonoLabel>
              <p className="mt-3 max-w-3xl text-fg-muted">
                Even with safe aliphatic chemistry a stretch garment sheds
                microfibers over its wash life. REWEAR-FUSED&apos;s enzymatic
                end-of-life replaces the ocean-microplastic-shedding fate with a
                controlled industrial hydrolysis fate.
              </p>
            </BeveledBox>
          </Reveal>
        </section>

        <footer className="relative bg-bg px-6 pb-32">
          <Reveal className="mx-auto max-w-5xl">
            <p className="max-w-3xl font-display text-2xl leading-snug sm:text-4xl">
              Carter&apos;s, here is the molecule for your next onesie, and here is
              the enzyme that closes its loop.
            </p>
            <p className="mt-3 font-display text-2xl text-fg-muted sm:text-4xl">
              Neither existed 72 hours ago.
            </p>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <BeveledBox className="p-5">
                <MonoLabel>The framing</MonoLabel>
                <p className="mt-2 text-sm">
                  The Nexus Circular of textiles. Cox put $150M into exactly that
                  shape of company.
                </p>
              </BeveledBox>
              <BeveledBox className="p-5">
                <MonoLabel>The market</MonoLabel>
                <p className="mt-2 text-sm">
                  Spandex $9B today to roughly $20B by 2033. License to an
                  incumbent (Hyosung, LYCRA, Asahi Kasei). Horizon 2030 to 2032.
                </p>
              </BeveledBox>
              <BeveledBox accent="bio" className="p-5">
                <MonoLabel>The residency ask</MonoLabel>
                <p className="mt-2 text-sm">
                  $10K and 6 weeks to wet-lab-validate, file a provisional, and
                  pilot one Carter&apos;s SKU.
                </p>
              </BeveledBox>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-4">
              <InstrumentButton href="/fiber" accent="fiber">
                The fiber
              </InstrumentButton>
              <InstrumentButton href="/enzyme" accent="bio">
                The enzyme
              </InstrumentButton>
              <InstrumentButton href="/passport" accent="bio" primary arrow>
                The passport
              </InstrumentButton>
              <InSilicoBadge />
            </div>
          </Reveal>
        </footer>
      </div>
    </>
  );
}
