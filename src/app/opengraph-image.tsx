import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Portfolio Maker — Buat CV & portofolio dengan AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #09090b 0%, #18181b 45%, #312e81 100%)",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, #6366f1 0%, #9333ea 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            PM
          </div>
          <span style={{ fontSize: 44, fontWeight: 800, color: "#fafafa" }}>
            Portfolio Maker
          </span>
        </div>
        <p
          style={{
            fontSize: 30,
            color: "#a1a1aa",
            maxWidth: 900,
            textAlign: "center",
            lineHeight: 1.35,
            margin: 0,
            padding: "0 48px",
          }}
        >
          Buat portofolio profesional dari screenshot — AI Gemini, PDF siap lamar.
        </p>
      </div>
    ),
    { ...size },
  );
}
