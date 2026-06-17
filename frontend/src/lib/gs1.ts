/**
 * GS1 Digital Link helper. Turns each passport's GS1 Digital Link identifier
 * (/01/<gtin>/21/<serial>) into a QR target hosted on OUR deployed app, so a
 * scanned passport QR resolves to the live passport for that exact garment. A
 * GS1 Digital Link resolver can run on any domain (a brand runs its own); our
 * app is that resolver. See app/01/[gtin]/21/[serial]/route.ts.
 */
import passportsData from "./artifacts/passports.json";
import type { DigitalProductPassport } from "./types";

const passports = passportsData as unknown as DigitalProductPassport[];

/** Pull the GTIN + serial out of a GS1 Digital Link URI. */
export function parseGs1Path(uri: string): { gtin: string; serial: string } | null {
  const m = uri.match(/\/01\/([^/]+)\/21\/([^/?#]+)/);
  return m ? { gtin: m[1]!, serial: m[2]! } : null;
}

/** gtin -> garmentId, built from the signed passport bundle at module load. */
export const GTIN_TO_GARMENT: Record<string, string> = Object.fromEntries(
  passports.flatMap((p) => {
    const parsed = parseGs1Path(p.gs1DigitalLinkUri || p.qrPayload || "");
    return parsed ? [[parsed.gtin, p.garmentId] as const] : [];
  }),
);

/** Deployed origin that hosts our resolver. Absolute so the QR scans from any
 *  phone; only the build sets it, so local dev falls back to the canonical URI. */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://rewear-fused.vercel.app").replace(/\/+$/, "");

/** The value encoded into the scannable QR. When the site origin is known, it is
 *  a GS1 Digital Link on our resolver that opens the live passport; otherwise the
 *  canonical id.gs1.org identifier (still a valid, parseable GS1 Digital Link). */
export function qrTargetFor(p: DigitalProductPassport): string {
  const parsed = parseGs1Path(p.gs1DigitalLinkUri || p.qrPayload || "");
  if (SITE_URL && parsed) return `${SITE_URL}/01/${parsed.gtin}/21/${parsed.serial}`;
  return p.qrPayload || p.gs1DigitalLinkUri;
}
