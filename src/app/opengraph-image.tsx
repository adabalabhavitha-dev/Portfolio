import { ImageResponse } from "next/og";
import { profile } from "@/data/profile";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${profile.name} — ${profile.headline}`;

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #1d2a1f 0%, #12140f 60%, #2a1f1a 100%)",
          color: "#EDEBE3",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 999,
              background: "#5C7F5E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            AB
          </div>
          <div style={{ fontSize: 26, color: "#9BB09B" }}>Portfolio</div>
        </div>

        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            marginTop: 48,
            letterSpacing: -2,
            lineHeight: 1.1,
          }}
        >
          {profile.name}
        </div>
        <div style={{ fontSize: 36, color: "#C7D4C7", marginTop: 16 }}>
          {profile.headline}
        </div>
        <div
          style={{
            fontSize: 26,
            color: "#E8845F",
            marginTop: 40,
            fontStyle: "italic",
          }}
        >
          {profile.motto}
        </div>
      </div>
    ),
    size,
  );
}