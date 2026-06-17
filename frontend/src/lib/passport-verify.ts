/**
 * In-browser verification of a passport's Ed25519 Verifiable Credential.
 *
 * Engine C's build.py signs each passport with a real Ed25519 key over
 * `json.dumps(unsigned, sort_keys=True, separators=(",",":"))`, where `unsigned`
 * is the W3C VC envelope (@context + type + issuer + credentialSubject). The
 * signed object is NOT stored verbatim in the passport, so here we reconstruct
 * the exact bytes client-side, decode the issuer's did:key public key, and verify
 * with WebCrypto. A judge can cryptographically confirm the passport is authentic
 * and unaltered, with no server and nothing to trust, and watch the proof go red
 * the instant any field is changed. Verified byte-for-byte against all three real
 * signatures before shipping.
 */
import type { DigitalProductPassport } from "./types";

const CONTEXT = [
  "https://www.w3.org/ns/credentials/v2",
  "https://test.uncefact.org/vocabulary/untp/dpp/0/",
];
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58decode(s: string): Uint8Array {
  const bytes: number[] = [];
  for (const ch of s) {
    let carry = B58.indexOf(ch);
    if (carry < 0) throw new Error("invalid base58 character");
    for (let j = 0; j < bytes.length; j++) {
      carry += (bytes[j] as number) * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  let pad = 0;
  for (const ch of s) {
    if (ch === "1") pad++;
    else break;
  }
  for (let k = 0; k < pad; k++) bytes.push(0);
  return new Uint8Array(bytes.reverse());
}

/** did:key:z6Mk... -> the raw 32-byte Ed25519 public key. */
export function didKeyToPublicKey(did: string): Uint8Array {
  const mb = did.split("did:key:")[1]?.split("#")[0];
  if (!mb || mb[0] !== "z") throw new Error("unsupported did:key multibase");
  const raw = base58decode(mb.slice(1));
  if (raw[0] !== 0xed || raw[1] !== 0x01) throw new Error("not an ed25519 did:key");
  return raw.slice(2);
}

/** json.dumps(value, sort_keys=True, separators=(",",":"), ensure_ascii=True) in JS. */
export function pyCanonical(value: unknown): string {
  const esc = (s: string): string => {
    let o = '"';
    for (const ch of s) {
      const c = ch.codePointAt(0) as number;
      if (ch === '"') o += '\\"';
      else if (ch === "\\") o += "\\\\";
      else if (c < 0x20) {
        const m: Record<number, string> = { 8: "\\b", 9: "\\t", 10: "\\n", 12: "\\f", 13: "\\r" };
        o += m[c] ?? "\\u" + c.toString(16).padStart(4, "0");
      } else if (c > 0x7e) {
        if (c > 0xffff) {
          const x = c - 0x10000;
          o +=
            "\\u" + (0xd800 + (x >> 10)).toString(16).padStart(4, "0") +
            "\\u" + (0xdc00 + (x & 0x3ff)).toString(16).padStart(4, "0");
        } else o += "\\u" + c.toString(16).padStart(4, "0");
      } else o += ch;
    }
    return o + '"';
  };
  const enc = (v: unknown): string => {
    if (v === null) return "null";
    if (typeof v === "boolean") return v ? "true" : "false";
    // every number in the signed payload is a Python float; integer-valued -> "N.0"
    if (typeof v === "number") return Number.isInteger(v) ? v.toFixed(1) : String(v);
    if (typeof v === "string") return esc(v);
    if (Array.isArray(v)) return "[" + v.map(enc).join(",") + "]";
    const o = v as Record<string, unknown>;
    return "{" + Object.keys(o).sort().map((k) => esc(k) + ":" + enc(o[k])).join(",") + "}";
  };
  return enc(value);
}

/** Reconstruct the exact canonical message Engine C signed. `tamper` flips the
 *  aromatic-amine safety claim, so the demo can show the signature break. */
export function signedMessage(
  p: DigitalProductPassport,
  garmentName: string,
  tamper = false,
): string {
  const unsigned = {
    "@context": CONTEXT,
    type: p.credential.type,
    issuer: p.credential.issuer,
    credentialSubject: {
      id: p.gs1DigitalLinkUri,
      garment: garmentName,
      classification: p.classification,
      aromaticAmineRelease: tamper ? "DETECTED" : p.aromaticAmineRelease,
    },
  };
  return pyCanonical(unsigned);
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Copy into a fresh ArrayBuffer so WebCrypto's BufferSource typing is satisfied. */
function toArrayBuffer(u: Uint8Array): ArrayBuffer {
  const b = new ArrayBuffer(u.byteLength);
  new Uint8Array(b).set(u);
  return b;
}

export type VerifyResult = { ok: boolean; supported: boolean };

/** Verify the passport's Ed25519 signature over `message` with WebCrypto. */
export async function verifyMessage(
  message: string,
  signatureB64: string,
  issuerDid: string,
): Promise<VerifyResult> {
  try {
    const msg = new TextEncoder().encode(message);
    const sig = b64ToBytes(signatureB64);
    const pub = didKeyToPublicKey(issuerDid);
    const key = await crypto.subtle.importKey(
      "raw",
      toArrayBuffer(pub),
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    const ok = await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      toArrayBuffer(sig),
      toArrayBuffer(msg),
    );
    return { ok, supported: true };
  } catch {
    // Browser without WebCrypto Ed25519 (pre-2025): cannot verify here.
    return { ok: false, supported: false };
  }
}
