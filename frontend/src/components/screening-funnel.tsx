"use client";

import { motion } from "motion/react";
import { engineA } from "@/lib/data";
import { CountUp } from "./count-up";
import { EASE } from "@/lib/motion";


/** Constraint-guided screening funnel: enumerated to scored to filtered to top. */
export function ScreeningFunnel() {
  const s = engineA.screening;
  const stages = [
    { label: "Enumerated", count: s.enumeratedCount },
    { label: "Scored", count: s.scoredCount },
    { label: "Filtered", count: s.filteredCount },
    { label: "Top candidate", count: s.topCandidateIds.length },
  ];
  const max = stages[0]!.count;
  const width = (c: number) => Math.max(0.08, Math.log(c + 1) / Math.log(max + 1));

  return (
    <div className="space-y-2">
      {stages.map((st, i) => {
        const last = i === stages.length - 1;
        return (
          <div key={st.label} className="relative h-11">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${width(st.count) * 100}%` }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: EASE }}
              className="h-full border border-rule"
              style={{
                background: last
                  ? "oklch(0.83 0.18 175 / 0.2)"
                  : "oklch(0.74 0.17 45 / 0.12)",
                borderColor: last ? "oklch(0.83 0.18 175 / 0.5)" : undefined,
              }}
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3">
              <span className="mono-label">{st.label}</span>
              <CountUp to={st.count} delay={i * 0.12} className="font-mono text-sm tabular-nums" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
