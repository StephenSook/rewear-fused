"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { BeveledBox } from "./instrument";
import { SceneBoundary } from "./scene-boundary";

// R3F Canvas is client-only. ssr:false keeps three off the server.
const MatchedPairMorph = dynamic(() => import("./matched-pair-morph"), {
  ssr: false,
  loading: () => (
    <div className="mono-label grid h-full place-items-center">loading matched-pair handoff</div>
  ),
});

const FALLBACK = "matched-pair animation unavailable on this device";

export function MatchedPairStage() {
  // Optimistic until probed after mount (R3F's WebGL context-creation failure
  // escapes the error boundary as an unhandled rejection, so the probe is what
  // surfaces a visible fallback on a no-WebGL device).
  const [webgl, setWebgl] = useState(true);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        const c = document.createElement("canvas");
        setWebgl(!!(c.getContext("webgl2") || c.getContext("webgl")));
      } catch {
        setWebgl(false);
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <BeveledBox tilt={false} className="h-[44vh] min-h-[340px] w-full overflow-hidden">
      {webgl ? (
        <SceneBoundary label={FALLBACK}>
          <MatchedPairMorph />
        </SceneBoundary>
      ) : (
        <div className="mono-label grid h-full place-items-center text-fg-muted">{FALLBACK}</div>
      )}
    </BeveledBox>
  );
}
