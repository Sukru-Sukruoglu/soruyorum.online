"use client";

import React from "react";

interface LogoProps {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { barW: 4, barGap: 3, barH: [10, 18, 28, 20, 11], divH: 30, soruFs: 9, yorumFs: 19, onlineFs: 7.5, dotSize: 15, innerDot: 10, gap: 11, divMr: 11, soruLs: 4 },
  md: { barW: 6, barGap: 4, barH: [16, 28, 44, 32, 18], divH: 48, soruFs: 14, yorumFs: 30, onlineFs: 11, dotSize: 24, innerDot: 16, gap: 17, divMr: 17, soruLs: 6 },
  lg: { barW: 7, barGap: 5, barH: [18, 32, 50, 36, 20], divH: 54, soruFs: 16, yorumFs: 34, onlineFs: 13, dotSize: 28, innerDot: 18, gap: 20, divMr: 20, soruLs: 7 },
  xl: { barW: 10, barGap: 7, barH: [26, 46, 72, 52, 28], divH: 78, soruFs: 23, yorumFs: 50, onlineFs: 18, dotSize: 40, innerDot: 26, gap: 28, divMr: 28, soruLs: 10 },
};

const keyframesStyle = `
@keyframes sy-pulse{0%{transform:scale(1);opacity:.8}60%{transform:scale(2);opacity:0}100%{transform:scale(1);opacity:0}}
`;

let injected = false;
function injectKeyframes() {
  if (injected || typeof document === "undefined") return;
  const s = document.createElement("style");
  s.textContent = keyframesStyle;
  document.head.appendChild(s);
  injected = true;
}

export function Logo({ variant = "dark", size = "md", animate = true, className }: LogoProps) {
  const c = sizeConfig[size];
  const isDark = variant === "dark";

  React.useEffect(() => { if (animate) injectKeyframes(); }, [animate]);

  const barColors = isDark
    ? ["#1A3A6A", "#1E4A88", "#FFD25D", "#FF3B30", "#1A3A6A"]
    : ["#D0DCF0", "#B0C8E8", "#FFD25D", "#FF3B30", "#D0DCF0"];

  return (
    <div className={className} style={{ display: "flex", alignItems: "center" }}>
      {/* Wave Bars */}
      <div style={{ display: "flex", alignItems: "center", gap: c.barGap, marginRight: c.gap, height: c.barH[2] + 10 }}>
        {barColors.map((bg, i) => (
          <div
            key={i}
            style={{
              width: c.barW,
              height: c.barH[i],
              borderRadius: c.barW / 2,
              background: bg,
            }}
          />
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1.5,
          height: c.divH,
          background: isDark ? "#1A3060" : "#D0DCF0",
          borderRadius: 1,
          marginRight: c.divMr,
          flexShrink: 0,
        }}
      />

      {/* Text Block */}
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, gap: 2 }}>
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: c.soruFs,
            fontWeight: 800,
            letterSpacing: c.soruLs,
            color: "#FF3B30",
            textTransform: "uppercase",
            textShadow: isDark ? "0 0 14px rgba(255,59,48,0.6), 0 0 4px rgba(255,59,48,0.3)" : "none",
          }}
        >
          SORU
        </span>

        <div style={{ display: "flex", alignItems: "center" }}>
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: c.yorumFs,
              fontWeight: 800,
              color: isDark ? "#fff" : "#0B192C",
              letterSpacing: 0.5,
              lineHeight: 1,
            }}
          >
            Y
          </span>

          {/* Live O */}
          <div
            style={{
              width: c.dotSize,
              height: c.dotSize,
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transform: "translateY(-1px)",
              margin: "0 1px",
            }}
          >
            {animate && (
              <>
                <div
                  style={{
                    position: "absolute",
                    width: c.dotSize,
                    height: c.dotSize,
                    borderRadius: "50%",
                    border: "1.5px solid #FF3B30",
                    animation: "sy-pulse 1.8s ease-out infinite",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    width: c.dotSize,
                    height: c.dotSize,
                    borderRadius: "50%",
                    border: "1.5px solid #FF3B30",
                    animation: "sy-pulse 1.8s ease-out infinite 0.72s",
                  }}
                />
              </>
            )}
            <div
              style={{
                width: c.innerDot,
                height: c.innerDot,
                background: "radial-gradient(circle at 38% 34%, #FF6B5B, #FF3B30)",
                borderRadius: "50%",
                boxShadow: "0 0 12px rgba(255,59,48,1), 0 0 24px rgba(255,59,48,0.4)",
                zIndex: 2,
                position: "relative",
              }}
            />
          </div>

          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: c.yorumFs,
              fontWeight: 800,
              color: isDark ? "#fff" : "#0B192C",
              letterSpacing: 0.5,
              lineHeight: 1,
            }}
          >
            RUM
          </span>

          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: c.onlineFs,
              fontWeight: 400,
              color: "#007AFF",
              marginLeft: 2,
              alignSelf: "flex-end",
              paddingBottom: size === "sm" ? 2 : 4,
            }}
          >
            .online
          </span>
        </div>
      </div>
    </div>
  );
}
