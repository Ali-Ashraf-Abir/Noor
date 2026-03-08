"use client";

import { useEffect, useRef, useState } from "react";

interface QiblaCompassProps {
  qiblaDegrees: number; // from data.qibla.direction.degrees
}

export default function QiblaCompass({ qiblaDegrees }: QiblaCompassProps) {
  const [heading, setHeading] = useState<number | null>(null);
  const [permission, setPermission] = useState<"prompt" | "granted" | "denied" | "unsupported">("prompt");
  const [error, setError] = useState<string | null>(null);

  const requestPermission = async () => {
    // iOS 13+ requires explicit permission request
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      try {
        const result = await (DeviceOrientationEvent as any).requestPermission();
        if (result === "granted") {
          setPermission("granted");
          startListening();
        } else {
          setPermission("denied");
        }
      } catch {
        setPermission("denied");
      }
    } else if (window.DeviceOrientationEvent) {
      // Android — no permission needed
      setPermission("granted");
      startListening();
    } else {
      setPermission("unsupported");
      setError("Compass not supported on this device.");
    }
  };

  const startListening = () => {
    const handler = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading is iOS; alpha is Android (needs inversion)
      const compassHeading =
        (e as any).webkitCompassHeading ??
        (e.alpha !== null ? (360 - e.alpha) % 360 : null);

      if (compassHeading !== null) setHeading(compassHeading);
    };

    window.addEventListener("deviceorientation", handler, true);
    return () => window.removeEventListener("deviceorientation", handler, true);
  };

  // Arrow should point toward Qibla relative to current heading
  // If heading = 50° and qibla = 230°, arrow rotates to 230 - 50 = 180°
  const arrowRotation = heading !== null ? (qiblaDegrees - heading + 360) % 360 : 0;
  const isAligned = heading !== null && Math.abs((qiblaDegrees - heading + 360) % 360) < 5;

  return (
    <div style={{
      background: "var(--bg-surface)",
      border: `1px solid ${isAligned ? "rgba(78,205,130,0.4)" : "var(--border)"}`,
      borderRadius: 16,
      padding: "1.5rem",
      textAlign: "center",
      transition: "border-color 0.3s",
    }}>
      <p style={{
        fontSize: "0.7rem",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: "var(--text-muted)",
        marginBottom: "1.25rem",
      }}>
        Qibla Direction
      </p>

      {permission === "prompt" && (
        <button
          onClick={requestPermission}
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-accent)",
            borderRadius: 10,
            padding: "0.6rem 1.4rem",
            color: "var(--gold)",
            fontSize: "0.9rem",
            cursor: "pointer",
            marginBottom: "1rem",
          }}
        >
          Enable Compass
        </button>
      )}

      {permission === "unsupported" && (
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Compass not available on this device.
        </p>
      )}

      {permission === "denied" && (
        <p style={{ color: "#e07070", fontSize: "0.85rem" }}>
          Permission denied. Enable motion sensors in your browser settings.
        </p>
      )}

      {permission === "granted" && (
        <>
          {/* Compass ring */}
          <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto 1rem" }}>
            {/* Outer ring with N/S/E/W */}
            <svg width="160" height="160" viewBox="0 0 160 160" style={{ position: "absolute", inset: 0 }}>
              <circle cx="80" cy="80" r="76" fill="none" stroke="var(--border)" strokeWidth="1.5" />
              <circle cx="80" cy="80" r="60" fill="none" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 6" />
              {/* Cardinal ticks */}
              {[0,45,90,135,180,225,270,315].map(deg => {
                const rad = (deg - 90) * Math.PI / 180;
                const isMajor = deg % 90 === 0;
                const r1 = isMajor ? 68 : 71;
                const r2 = 76;
                return (
                  <line
                    key={deg}
                    x1={80 + r1 * Math.cos(rad)} y1={80 + r1 * Math.sin(rad)}
                    x2={80 + r2 * Math.cos(rad)} y2={80 + r2 * Math.sin(rad)}
                    stroke={isMajor ? "var(--text-muted)" : "var(--border)"}
                    strokeWidth={isMajor ? 1.5 : 0.8}
                  />
                );
              })}
              {/* N S E W labels */}
              {[
                { label: "N", deg: 0   },
                { label: "E", deg: 90  },
                { label: "S", deg: 180 },
                { label: "W", deg: 270 },
              ].map(({ label, deg }) => {
                const rad = (deg - 90) * Math.PI / 180;
                return (
                  <text
                    key={label}
                    x={80 + 55 * Math.cos(rad)}
                    y={80 + 55 * Math.sin(rad)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={label === "N" ? "var(--gold)" : "var(--text-muted)"}
                    fontSize="11"
                    fontWeight={label === "N" ? "700" : "400"}
                    fontFamily="monospace"
                  >
                    {label}
                  </text>
                );
              })}
            </svg>

            {/* Rotating Kaaba arrow */}
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: `rotate(${arrowRotation}deg)`,
              transition: heading !== null ? "transform 0.15s ease-out" : "none",
            }}>
              <svg width="40" height="80" viewBox="0 0 40 80">
                {/* Arrow pointing up = toward Qibla */}
                <polygon
                  points="20,4 34,44 20,36 6,44"
                  fill={isAligned ? "#4ecd82" : "var(--gold)"}
                  style={{ transition: "fill 0.3s" }}
                />
                {/* Tail */}
                <polygon
                  points="20,76 26,44 20,52 14,44"
                  fill="var(--text-muted)"
                  opacity="0.5"
                />
                {/* Center dot */}
                <circle cx="20" cy="48" r="4" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1" />
              </svg>
            </div>

            {/* Kaaba icon at center */}
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.1rem",
              pointerEvents: "none",
            }}>
              🕋
            </div>
          </div>

          {/* Status */}
          <div style={{ marginTop: "0.5rem" }}>
            {heading === null ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                Move your phone to calibrate…
              </p>
            ) : isAligned ? (
              <p style={{ color: "#4ecd82", fontSize: "0.9rem", fontWeight: 600 }}>
                ✓ Facing Qibla
              </p>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                Rotate until the arrow turns green
              </p>
            )}
          </div>

          {/* Degrees readout */}
          {heading !== null && (
            <div style={{
              display: "flex", justifyContent: "center", gap: "1.5rem",
              marginTop: "1rem",
              fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-muted)",
            }}>
              <span>Qibla: <strong style={{ color: "var(--gold)" }}>{Math.round(qiblaDegrees)}°</strong></span>
              <span>Heading: <strong style={{ color: "var(--text-secondary)" }}>{Math.round(heading)}°</strong></span>
            </div>
          )}
        </>
      )}
    </div>
  );
}