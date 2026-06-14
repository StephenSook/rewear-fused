"use client";

import dynamic from "next/dynamic";
import { BeveledBox } from "./instrument";
import { SceneBoundary } from "./scene-boundary";

// Mol* loads client-only. ssr:false keeps it off the server entirely.
const MolstarViewer = dynamic(() => import("./molstar-viewer"), {
  ssr: false,
  loading: () => (
    <div className="mono-label grid h-full place-items-center">initializing viewer</div>
  ),
});

export function EnzymeStage({
  url,
  activeSite,
  chain,
}: {
  url: string;
  activeSite?: number[];
  chain?: string;
}) {
  return (
    <BeveledBox
      accent="bio"
      tilt={false}
      beam
      className="h-[60vh] min-h-[420px] w-full overflow-hidden shadow-[var(--shadow-bloom)]"
    >
      <SceneBoundary label="structure viewer unavailable on this device">
        <MolstarViewer url={url} className="h-full w-full" activeSite={activeSite} chain={chain} />
      </SceneBoundary>
    </BeveledBox>
  );
}
