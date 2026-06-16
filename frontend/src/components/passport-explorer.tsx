"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from "motion/react";
import { cn } from "@/lib/cn";
import { getGarments, getClassification, getPassport, getRegulation } from "@/lib/data";
import {
  fetchClassification,
  fetchPassport,
  engineCModelVersion,
  type Source,
} from "@/lib/engine-c-client";
import { BeveledBox, MonoLabel } from "./instrument";
import { PassportCard } from "./passport-card";
import { Reveal } from "./reveal";
import { CountUp, fmtPct } from "./count-up";
import { audioEngine } from "@/lib/audio-engine";
import type { RegStatus, Decision, Classification, DigitalProductPassport } from "@/lib/types";
import { EASE } from "@/lib/motion";


const STATUS_COLOR: Record<RegStatus, string> = {
  PASS: "text-pass",
  FLAG: "text-warn",
  FAIL: "text-fail",
};

const DECISION: Record<Decision, { label: string; text: string; route: string }> = {
  clear: { label: "CLEAR", text: "text-pass", route: "fiber-to-fiber loop" },
  "lab-test": { label: "LAB-TEST", text: "text-warn", route: "targeted lab test, then route" },
  divert: { label: "DIVERT", text: "text-fail", route: "divert from the loop" },
};

/** Render the static signed bundle immediately, then upgrade to the live Engine C
 *  endpoint if it answers within the timeout (else stay on the bundle). */
function useEngineC(selectedId: string) {
  // Static signed-bundle values, derived each render (no setState-in-effect).
  const staticC = getClassification(selectedId);
  const staticP = getPassport(selectedId);
  // Resolved result tagged with the id it belongs to (so a stale result can never
  // show under a new selection) and with PER-ARTIFACT source: a live classify is
  // shown + labelled live even if the passport endpoint lagged, and vice versa.
  const [resolved, setResolved] = useState<{
    id: string;
    c?: Classification;
    cSource: Source;
    p?: DigitalProductPassport;
    pSource: Source;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchClassification(selectedId), fetchPassport(selectedId)])
      .then(([rc, rp]) => {
        if (cancelled) return;
        setResolved({ id: selectedId, c: rc.data, cSource: rc.source, p: rp.data, pSource: rp.source });
      })
      .catch((err) => {
        if (cancelled) return;
        if (process.env.NODE_ENV !== "production") {
          console.error("[engine-c] useEngineC resolve failed", err);
        }
        setResolved(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const current = resolved?.id === selectedId ? resolved : null;
  return {
    classification: current?.c ?? staticC,
    passport: current?.p ?? staticP,
    // the badge reflects the source of what the ROUTER shows (the classification)
    source: (current?.cSource ?? "cached") as Source,
  };
}

function SourceBadge({ source }: { source: Source }) {
  const live = source === "live";
  return (
    <span
      title={
        live
          ? "Classified by the live Engine C endpoint just now."
          : "Served from the signed offline bundle (the frozen Engine C model output)."
      }
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[0.6rem] tracking-widest uppercase",
        live ? "border-pass/40 text-pass" : "border-rule text-fg-muted",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", live ? "animate-pulse bg-pass" : "bg-fg-muted")} />
      Engine C · {live ? "live" : "signed bundle"} · {engineCModelVersion}
    </span>
  );
}

/** The router classifying its way to a verdict, then revealing it. Presentation
 *  only: it always settles on the real (live or signed-bundle) decision. */
function RegulatoryRouter({
  selectedId,
  classification,
}: {
  selectedId: string;
  classification: Classification | undefined;
}) {
  const reduce = useReducedMotion();
  const [settledId, setSettledId] = useState<string | null>(null);
  const routing = !reduce && settledId !== selectedId;

  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => setSettledId(selectedId), 460);
    return () => clearTimeout(t);
  }, [selectedId, reduce]);

  if (!classification) return null;
  const d = DECISION[classification.decision];

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.07, delayChildren: 0.04 } },
  };
  const item: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 10 },
    show: reduce
      ? { opacity: 1 }
      : { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
  };

  return (
    <BeveledBox className="p-5">
      <AnimatePresence mode="wait">
        {routing ? (
          <motion.div
            key="classifying"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-6"
          >
            <MonoLabel>classifying against real US/EU regulation</MonoLabel>
            <div className="mt-3 h-1 w-full overflow-hidden bg-fg/10">
              <motion.div
                className="h-full w-1/3 bg-accent-bio"
                animate={{ x: ["-110%", "320%"] }}
                transition={{ duration: 0.55, ease: "easeInOut", repeat: Infinity }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div key={`v-${selectedId}`} variants={container} initial="hidden" animate="show">
            <motion.div variants={item} className="flex items-end justify-between gap-4">
              <div>
                <MonoLabel>router decision</MonoLabel>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className={cn("font-display text-3xl leading-none", d.text)}>
                    {d.label}
                  </span>
                  <span className="font-mono text-[0.65rem] text-fg-muted">→ {d.route}</span>
                </div>
              </div>
              <div className="text-right">
                <MonoLabel>confidence</MonoLabel>
                <CountUp
                  to={classification.probability * 100}
                  format={fmtPct}
                  duration={0.7}
                  replayKey={selectedId}
                  immediate
                  className="block font-mono text-2xl leading-none tabular-nums"
                />
              </div>
            </motion.div>

            <motion.div variants={item} className="mt-3 h-1 w-full bg-fg/10">
              <motion.div
                className="h-full origin-left bg-accent-bio"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: classification.probability }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
              />
            </motion.div>

            <ul className="mt-5 space-y-3">
              {classification.triggeredRegulations.map((t) => {
                const reg = getRegulation(t.regulationId);
                return (
                  <motion.li
                    key={t.regulationId}
                    variants={item}
                    className="border-b border-rule/50 pb-3 last:border-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm">{reg?.name ?? t.regulationId}</span>
                      <span
                        className={cn(
                          "font-mono text-[0.65rem] tracking-widest uppercase",
                          STATUS_COLOR[t.status],
                        )}
                      >
                        {t.status}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[0.65rem] text-fg-muted">
                      {reg?.citation} · {reg?.limit}
                    </div>
                    <div className="mt-1 text-xs text-fg-muted">{t.detail}</div>
                  </motion.li>
                );
              })}
            </ul>

            <motion.div variants={item} className="mt-4 font-mono text-[0.65rem] text-fg-muted">
              PR-AUC {classification.prAuc.toFixed(2)} · AUC {classification.auc.toFixed(2)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </BeveledBox>
  );
}

export function PassportExplorer({ initialGarmentId }: { initialGarmentId?: string }) {
  const garments = getGarments();
  // Open on the deep-linked garment if a scanned passport QR resolved to
  // /passport?g=<id> (the server page passes it through); otherwise the legging
  // (the elastane story), falling back safely if the bundle changes.
  const [selectedId, setSelectedId] = useState(() => {
    if (initialGarmentId && garments.some((g) => g.id === initialGarmentId)) {
      return initialGarmentId;
    }
    return garments.find((g) => g.archetype === "legging")?.id ?? garments[0]?.id ?? "";
  });
  const garment = garments.find((g) => g.id === selectedId);
  const { classification, passport, source } = useEngineC(selectedId);

  const select = (id: string) => {
    if (id === selectedId) return;
    audioEngine.tick();
    setSelectedId(id);
  };

  return (
    <div className="space-y-8">
      <Reveal>
        <div>
          <MonoLabel>01 · Garment intake</MonoLabel>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {garments.map((g) => {
              const active = g.id === selectedId;
              return (
                <button
                  key={g.id}
                  onClick={() => select(g.id)}
                  aria-pressed={active}
                  className="text-left"
                >
                  <BeveledBox
                    accent={active ? "bio" : "none"}
                    press
                    className={cn(
                      "p-4 transition-colors",
                      active ? "bg-bg-elevated" : "bg-bg-elevated/30 hover:bg-bg-elevated/60",
                    )}
                  >
                    <div className="relative mb-3 aspect-square w-full overflow-hidden">
                      <Image
                        src={g.imageUrl}
                        alt={g.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 200px"
                        className="object-cover"
                      />
                    </div>
                    <div className="font-display text-base leading-tight">{g.name}</div>
                    <div className="mt-2 font-mono text-[0.65rem] text-fg-muted">
                      {g.fiberComposition.map((c) => `${c.percent}% ${c.fiber}`).join(" · ")}
                    </div>
                  </BeveledBox>
                </button>
              );
            })}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <MonoLabel>02 · Recyclability passport</MonoLabel>
            <div className="mt-3">
              <AnimatePresence mode="wait">
                {passport && garment ? (
                  <motion.div
                    key={selectedId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <PassportCard garment={garment} passport={passport} />
                  </motion.div>
                ) : (
                  <BeveledBox className="p-6 text-sm text-fg-muted">
                    No pre-computed passport for this garment yet. The router still
                    classifies it; the passport renders once Engine C emits it.
                  </BeveledBox>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <MonoLabel>03 · Regulatory router</MonoLabel>
              <SourceBadge source={source} />
            </div>
            <div className="mt-3">
              <RegulatoryRouter selectedId={selectedId} classification={classification} />
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
