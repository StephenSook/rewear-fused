"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useInView } from "motion/react";
import { ArrowDown } from "@phosphor-icons/react/dist/ssr";
import { BeveledBox, MonoLabel, InSilicoBadge } from "./instrument";
import { BeveledButton } from "./beveled-button";
import { storyProgress, storyPointer } from "./story-signals";
import { audioEngine } from "@/lib/audio-engine";
import { SceneBoundary } from "./scene-boundary";

const StoryScene = dynamic(() => import("./story-scene"), { ssr: false });

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** A pinned scroll beat: a tall section whose inner panel sticks for half its height. */
function Beat({
  children,
  className,
  bloom,
}: {
  children: ReactNode;
  className?: string;
  bloom?: ReactNode;
}) {
  return (
    <section className="relative h-[150vh]">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center px-6 text-center">
        {/* soft scrim so copy stays legible over the live particle scene */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 62% at 50% 50%, color-mix(in oklch, var(--color-bg) 86%, transparent), color-mix(in oklch, var(--color-bg) 45%, transparent) 58%, transparent 88%)",
          }}
        />
        {bloom}
        <div className={`relative z-10 flex w-full flex-col items-center ${className ?? ""}`}>
          {children}
        </div>
      </div>
    </section>
  );
}

/** Count-up statistic, fires once when its panel scrolls into view. */
function Stat({
  value,
  suffix = "",
  label,
  source,
}: {
  value: number;
  suffix?: string;
  label: string;
  source: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const DUR = 1100;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / DUR);
      setN(Math.round(p * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);
  return (
    <div ref={ref}>
      <div className="font-display text-5xl tabular-nums sm:text-6xl">
        {n}
        {suffix}
      </div>
      <div className="mt-2 text-sm text-fg-muted">{label}</div>
      <div className="mono-label mt-1">{source}</div>
    </div>
  );
}

export function StoryExperience() {
  const trackRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const fused = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      const el = trackRef.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), Math.max(total, 1));
      const p = total > 0 ? scrolled / total : 0;
      storyProgress.value = p;

      // close burst: a bloom swells and a ring expands as the two accents fuse,
      // plus a one-shot cleavage cue at the fuse point.
      const f = smoothstep(0.84, 0.98, p);
      if (bloomRef.current) {
        bloomRef.current.style.opacity = String(f);
        bloomRef.current.style.transform = `translate(-50%, -50%) scale(${0.55 + f * 1.05})`;
      }
      if (ringRef.current) {
        ringRef.current.style.opacity = String(Math.max(0, f * (1 - f) * 4));
        ringRef.current.style.transform = `translate(-50%, -50%) scale(${0.3 + f * 1.7})`;
      }
      if (p > 0.9 && !fused.current) {
        fused.current = true;
        audioEngine.cleavage(1.1);
      } else if (p < 0.85) {
        fused.current = false;
      }
    };
    const onPointer = (e: PointerEvent) => {
      storyPointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      storyPointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return (
    <>
      <SceneBoundary fallback={null}>
        <StoryScene />
      </SceneBoundary>

      <div ref={trackRef} className="relative z-10">
        {/* 01 · hero */}
        <Beat>
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-fg/70">
            Cox Play With Purpose · Carter&apos;s Making &amp; Remaking
          </span>
          <h1 className="mt-6 font-display text-6xl leading-[0.95] sm:text-8xl">
            Safe to wear,
            <br />
            <span className="text-accent-fiber">able to be</span>{" "}
            <span className="text-accent-bio">remade.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-fg-muted">
            A single computational co-design loop that closes the recycling loop on
            children&apos;s stretch apparel.
          </p>
          <div className="mono-label mt-14 flex items-center gap-2">
            <ArrowDown className="h-4 w-4 animate-bounce" /> scroll
          </div>
        </Beat>

        {/* 02 · the downcycle reality */}
        <Beat>
          <MonoLabel>01 · The reality</MonoLabel>
          <p className="mt-6 max-w-3xl font-display text-3xl leading-snug sm:text-5xl">
            Carter&apos;s already collects worn baby clothes, then shreds them into
            insulation and pet bedding.
          </p>
          <p className="mt-6 max-w-2xl text-fg-muted">
            Two walls stop a onesie from ever becoming a onesie again.
          </p>
        </Beat>

        {/* 03 · the two walls */}
        <Beat>
          <div className="w-full max-w-5xl">
            <MonoLabel>02 · The two walls</MonoLabel>
            <div className="mt-6 grid gap-6 text-left md:grid-cols-2">
              <BeveledBox accent="fiber" className="h-full p-8 bg-bg-elevated/85 backdrop-blur-md">
                <MonoLabel>Wall 1</MonoLabel>
                <p className="mt-4 font-display text-2xl">Chemical safety</p>
                <p className="mt-3 text-fg-muted">
                  Carter&apos;s cannot prove the recovered fabric is chemically safe for
                  infant skin.
                </p>
              </BeveledBox>
              <BeveledBox accent="bio" className="h-full p-8 bg-bg-elevated/85 backdrop-blur-md">
                <MonoLabel>Wall 2</MonoLabel>
                <p className="mt-4 font-display text-2xl">Elastane</p>
                <p className="mt-3 text-fg-muted">
                  Carter&apos;s cannot break down the elastane woven into every stretch
                  garment.
                </p>
              </BeveledBox>
            </div>
          </div>
        </Beat>

        {/* 04 · the stats */}
        <Beat>
          <BeveledBox className="w-full max-w-5xl p-10 bg-bg-elevated/85 backdrop-blur-md">
            <MonoLabel>03 · The scale</MonoLabel>
            <div className="mt-8 grid gap-12 text-left sm:grid-cols-2 lg:grid-cols-4">
              <Stat value={92} suffix="M" label="tonnes of textile waste per year" source="UNEP 2025" />
              <Stat value={80} suffix="%" label="of all clothing contains elastane" source="Fashion for Good" />
              <Stat value={1} suffix="%" label="of it makes a recycler reject the whole garment" source="Fashion for Good" />
              <Stat value={1} suffix="%" label="of garments are recycled fiber-to-fiber" source="McKinsey" />
            </div>
          </BeveledBox>
        </Beat>

        {/* 05 · the thesis */}
        <Beat>
          <MonoLabel>04 · The thesis</MonoLabel>
          <p className="mt-6 max-w-3xl font-display text-3xl leading-snug sm:text-5xl">
            Do not attack today&apos;s elastane. Co-design a new{" "}
            <Link href="/fiber" className="text-accent-fiber underline-offset-4 hover:underline">
              cleavable fiber
            </Link>{" "}
            and the matched{" "}
            <Link href="/enzyme" className="text-accent-bio underline-offset-4 hover:underline">
              enzyme
            </Link>{" "}
            that closes its loop.
          </p>
          <div className="mt-8">
            <InSilicoBadge />
          </div>
        </Beat>

        {/* 06 · closing */}
        <Beat
          bloom={
            <>
              <div
                ref={bloomRef}
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-[55vh] w-[55vh] rounded-full opacity-0 will-change-transform"
                style={{
                  transform: "translate(-50%, -50%) scale(0.55)",
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.85), rgba(52,224,196,0.45) 28%, rgba(224,147,79,0.28) 52%, transparent 70%)",
                  filter: "blur(30px)",
                }}
              />
              <div
                ref={ringRef}
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-[40vh] w-[40vh] rounded-full border border-accent-bio/50 opacity-0 will-change-transform"
                style={{ transform: "translate(-50%, -50%) scale(0.3)" }}
              />
            </>
          }
        >
          <p className="max-w-3xl font-display text-4xl leading-tight sm:text-6xl">
            Neither the molecule nor the enzyme has any prior art.
          </p>
          <div className="mt-10">
            <BeveledButton href="/loop" accent="bio">
              Watch the loop close
            </BeveledButton>
          </div>
        </Beat>
      </div>
    </>
  );
}
