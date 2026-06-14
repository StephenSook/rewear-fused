"use client";

/**
 * Root error boundary. Replaces the whole document if the root layout itself
 * throws, so it cannot rely on the app's CSS, so styles are inlined to guarantee a
 * dark, on-brand fallback rather than an unstyled white page.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0b0e11",
          color: "#f3f5f7",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "28rem" }}>
          <div style={{ letterSpacing: "0.18em", textTransform: "uppercase", fontSize: "0.7rem", color: "#e0a14f" }}>
            instrument fault
          </div>
          <h1 style={{ marginTop: "0.75rem", fontSize: "1.75rem", fontWeight: 600 }}>The instrument restarted.</h1>
          <p style={{ marginTop: "0.75rem", fontSize: "0.9rem", color: "#9aa3ad" }}>
            REWEAR-FUSED hit an unexpected fault. Reload to bring it back.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.65rem 1.25rem",
              background: "transparent",
              color: "#f3f5f7",
              border: "1px solid #34e0c4",
              cursor: "pointer",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontSize: "0.75rem",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
