import { QRCodeSVG } from "qrcode.react";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { BeveledBox, MonoLabel, DecisionBadge, InSilicoBadge } from "./instrument";
import { qrTargetFor } from "@/lib/gs1";
import type { Garment, DigitalProductPassport } from "@/lib/types";

/** The Digital Recyclability Passport card. The judge physically scans the QR. */
export function PassportCard({
  garment,
  passport,
}: {
  garment: Garment;
  passport: DigitalProductPassport;
}) {
  return (
    <BeveledBox accent="bio" className="p-6 shadow-[var(--shadow-bloom)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <MonoLabel>Digital Recyclability Passport</MonoLabel>
          <h3 className="mt-2 font-display text-2xl leading-tight">{garment.name}</h3>
        </div>
        <DecisionBadge decision={passport.classification.decision} />
      </div>

      <div className="mt-6 grid grid-cols-[1fr_auto] gap-6">
        <div className="space-y-4">
          <div>
            <MonoLabel>Fiber composition</MonoLabel>
            <ul className="mt-2 space-y-1 font-mono text-sm">
              {garment.fiberComposition.map((c) => (
                <li key={c.fiber} className="flex justify-between border-b border-rule/50 pb-1">
                  <span>{c.fiber}</span>
                  <span className="text-fg-muted">{c.percent}%</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 text-pass">
            <CheckCircle weight="fill" className="h-5 w-5" />
            <span className="font-mono text-xs tracking-wide uppercase">
              Aromatic amine release: NONE
            </span>
          </div>
          <p className="text-xs text-fg-muted">
            Aliphatic isocyanate design. No MDA or TDA pathway.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          {/* scan reticle: a pulsing frame + corner ticks sit OUTSIDE the QR's
              quiet zone, never over the code modules, so it stays scannable on
              stage. The pulse freezes static under prefers-reduced-motion. */}
          <div className="relative p-2">
            <span
              aria-hidden
              className="qr-scan-pulse pointer-events-none absolute inset-0 border border-accent-bio/60"
            />
            <span aria-hidden className="pointer-events-none absolute -top-px -left-px h-2.5 w-2.5 border-t border-l border-accent-bio" />
            <span aria-hidden className="pointer-events-none absolute -top-px -right-px h-2.5 w-2.5 border-t border-r border-accent-bio" />
            <span aria-hidden className="pointer-events-none absolute -bottom-px -left-px h-2.5 w-2.5 border-b border-l border-accent-bio" />
            <span aria-hidden className="pointer-events-none absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-accent-bio" />
            <div className="bg-white p-2">
              <QRCodeSVG value={qrTargetFor(passport)} size={104} level="M" />
            </div>
          </div>
          <MonoLabel className="text-[0.6rem]">GS1 Digital Link · scan it</MonoLabel>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-rule pt-4">
        <span className="font-mono text-[0.65rem] text-fg-muted break-all">
          {passport.gs1DigitalLinkUri}
        </span>
        <InSilicoBadge />
      </div>
    </BeveledBox>
  );
}
