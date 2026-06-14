"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { BeveledBox } from "./instrument";
import { SceneBoundary } from "./scene-boundary";

// R3F Canvas is client-only. ssr:false keeps three off the server.
const FiberArchitecture = dynamic(() => import("./fiber-architecture"), {
  ssr: false,
  loading: () => (
    <div className="mono-label grid h-full place-items-center">loading fiber model</div>
  ),
});

const FALLBACK = "fiber model unavailable on this device";

export function FiberStage() {
  // Optimistic until probed after mount (R3F builds its WebGL renderer in an
  // un-awaited async path, so a context-creation failure escapes the error
  // boundary as an unhandled rejection rather than a render throw; the probe is
  // what surfaces a visible fallback on a no-WebGL device).
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
    <BeveledBox accent="fiber" tilt={false} className="h-[48vh] min-h-[360px] w-full overflow-hidden">
      {webgl ? (
        <SceneBoundary label={FALLBACK}>
          <FiberArchitecture />
        </SceneBoundary>
      ) : (
        <div className="mono-label grid h-full place-items-center px-4 text-center text-fg-muted">
          {FALLBACK}
        </div>
      )}
    </BeveledBox>
  );
}
