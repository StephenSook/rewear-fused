/**
 * Live Engine C client with a demo-safe fallback. When NEXT_PUBLIC_ENGINE_C_API_URL
 * is set (Vinh's deployed FastAPI on Render), the passport classifies against the
 * LIVE endpoint so a judge sees a real server respond, not hardcoded JSON. If the
 * endpoint is unset, slow, down, or returns an unexpected shape, the call falls
 * back to the signed static bundle within a hard timeout, so the demo never hangs
 * or breaks (the artifact is byte-identical to the live model under frozen-model
 * parity). A malformed live response is rejected by a runtime shape guard rather
 * than rendered under a "live" badge.
 */
import { getClassification, getPassport } from "./data";
import manifest from "./artifacts/manifest.json";
import type { Classification, DigitalProductPassport } from "./types";

const BASE = (process.env.NEXT_PUBLIC_ENGINE_C_API_URL || "").replace(/\/+$/, "");
const TIMEOUT_MS = 2500;

export type Source = "live" | "cached";

export const engineCModelVersion =
  (manifest as { modelVersions?: Record<string, string> }).modelVersions?.engineC ?? "v1.0";

function warnDev(msg: string, detail: unknown): void {
  if (process.env.NODE_ENV !== "production") console.warn(msg, detail);
}

// Guards check the fields the UI actually dereferences (probability/prAuc/auc in
// the router; gs1DigitalLinkUri/qrPayload in the passport card), so a malformed
// live response is rejected and we fall back to the byte-identical signed bundle
// rather than rendering NaN/undefined under a "live" badge.
function isClassification(x: unknown): x is Classification {
  if (!x || typeof x !== "object") return false;
  const c = x as Record<string, unknown>;
  return (
    typeof c.decision === "string" &&
    typeof c.garmentId === "string" &&
    typeof c.probability === "number" &&
    typeof c.prAuc === "number" &&
    typeof c.auc === "number" &&
    Array.isArray(c.triggeredRegulations)
  );
}

function isPassport(x: unknown): x is DigitalProductPassport {
  if (!x || typeof x !== "object") return false;
  const p = x as Record<string, unknown>;
  return (
    typeof p.gs1DigitalLinkUri === "string" &&
    typeof p.qrPayload === "string" &&
    isClassification(p.classification)
  );
}

async function getJSON(path: string): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`engine-c HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchClassification(
  id: string,
): Promise<{ data: Classification | undefined; source: Source }> {
  if (!BASE) return { data: getClassification(id), source: "cached" };
  try {
    const live = await getJSON(`/classify/${id}`);
    if (isClassification(live)) return { data: live, source: "live" };
    warnDev(`[engine-c] /classify/${id} returned an unexpected shape; using bundle`, live);
  } catch (err) {
    warnDev(`[engine-c] live classify failed for ${id}; using bundle`, err);
  }
  return { data: getClassification(id), source: "cached" };
}

export async function fetchPassport(
  id: string,
): Promise<{ data: DigitalProductPassport | undefined; source: Source }> {
  if (!BASE) return { data: getPassport(id), source: "cached" };
  try {
    const live = await getJSON(`/passport/${id}`);
    if (isPassport(live)) return { data: live, source: "live" };
    warnDev(`[engine-c] /passport/${id} returned an unexpected shape; using bundle`, live);
  } catch (err) {
    warnDev(`[engine-c] live passport failed for ${id}; using bundle`, err);
  }
  return { data: getPassport(id), source: "cached" };
}
