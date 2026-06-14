"use client";

import { useState } from "react";
import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react/dist/ssr";
import { audioEngine } from "@/lib/audio-engine";
import { Tilt3D } from "./tilt3d";
import { cn } from "@/lib/cn";

/**
 * Sound toggle. The click is the user gesture that unlocks Web Audio; it starts
 * the ambient bed (the produced Suno track if present, else the synth pad) and
 * arms the cleavage cues. Clicking again fades everything out. Tilts in 3D toward
 * the cursor like the nav chips.
 */
export function SoundToggle() {
  const [on, setOn] = useState(false);

  return (
    <Tilt3D accent="bio" maxTilt={10} magnetic={0.14} className="fixed right-4 top-4 z-40 hidden sm:block">
      <button
        onClick={() => setOn(audioEngine.toggle())}
        aria-pressed={on}
        className={cn(
          "mono-label flex items-center gap-2 border px-3 py-2 transition-colors hover:text-fg",
          on ? "border-accent-bio/45 text-fg" : "border-rule",
        )}
      >
        {on ? (
          <SpeakerHigh className="h-4 w-4 text-accent-bio" />
        ) : (
          <SpeakerSlash className="h-4 w-4" />
        )}
        sound {on ? "on" : "off"}
      </button>
    </Tilt3D>
  );
}
