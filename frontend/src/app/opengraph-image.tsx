import { ImageResponse } from "next/og";

export const alt = "REWEAR-FUSED · safe to wear, able to be remade";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Programmatic Open Graph card for the shared/deployed link. On-brand and
 * code-drawn, so there is no binary asset to ship or keep in sync.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px",
          background:
            "radial-gradient(120% 90% at 50% -10%, #16202a 0%, #0b0e11 60%), #0b0e11",
          color: "#f3f5f7",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 14, height: 14, background: "#34e0c4" }} />
          <div style={{ width: 14, height: 14, background: "#e0934f" }} />
          <div
            style={{
              fontSize: 22,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "#9aa3ad",
            }}
          >
            In-silico co-design loop
          </div>
        </div>
        <div style={{ fontSize: 104, fontWeight: 700, letterSpacing: -2, marginTop: 28 }}>
          REWEAR-FUSED
        </div>
        <div style={{ fontSize: 38, color: "#c7ccd2", marginTop: 18, maxWidth: 900, lineHeight: 1.25 }}>
          The molecule for your next onesie, and the enzyme that closes its loop.
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 44 }}>
          {["Cleavable elastane", "Designed enzyme", "Recyclability passport"].map((t) => (
            <div
              key={t}
              style={{
                fontSize: 20,
                color: "#9aa3ad",
                border: "1px solid #2a3640",
                padding: "10px 18px",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
