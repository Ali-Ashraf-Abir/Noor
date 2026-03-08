"use client";

import { useEffect, useRef, useState } from "react";

interface QiblaCompassProps {
  qiblaDegrees: number;
}

const SMOOTHING = 5; // number of readings to average

function averageAngles(angles: number[]): number {
  // Use circular mean to correctly average angles (handles 359° + 1° = 0°, not 180°)
  const sinSum = angles.reduce((s, a) => s + Math.sin((a * Math.PI) / 180), 0);
  const cosSum = angles.reduce((s, a) => s + Math.cos((a * Math.PI) / 180), 0);
  return ((Math.atan2(sinSum / angles.length, cosSum / angles.length) * 180) / Math.PI + 360) % 360;
}

export default function QiblaCompass({ qiblaDegrees }: QiblaCompassProps) {
  const [heading, setHeading] = useState<number | null>(null);
  const [permission, setPermission] = useState<"prompt" | "granted" | "denied" | "unsupported">("prompt");
  const buffer = useRef<number[]>([]);
  const cleanupRef = useRef<(() => void) | null>(null);
  const sensor = new (window as any).AbsoluteOrientationSensor({ frequency: 10 });
  const startListening = () => {
    const handler = (e: DeviceOrientationEvent) => {
      let raw: number | null = null;

      if ((e as any).webkitCompassHeading != null) {
        // iOS — already absolute North-referenced, most reliable
        raw = (e as any).webkitCompassHeading;
      } else if (e.absolute && e.alpha !== null) {
        // Android with absolute orientation
        raw = (360 - e.alpha) % 360;
      } else if (e.alpha !== null) {
        // Android without absolute — less reliable but best we can do
        raw = (360 - e.alpha) % 360;
      }

      if (raw === null) return;

      // Fill the circular buffer
      buffer.current.push(raw);
      if (buffer.current.length > SMOOTHING) buffer.current.shift();

      // Only update state once we have enough readings
      if (buffer.current.length >= SMOOTHING) {
        setHeading(averageAngles(buffer.current));
      }
    };

    // Prefer absolutedeviceorientation for Android (true North reference)
    if ((window as any).AbsoluteOrientationSensor)  {
      try {
        const sensor = new (window as any).AbsoluteOrientationSensor({ frequency: 10 });
        sensor.addEventListener("reading", () => {
          const q = sensor.quaternion;
          // Convert quaternion to compass heading
          const heading = Math.atan2(
            2 * (q[0] * q[1] + q[2] * q[3]),
            1 - 2 * (q[1] * q[1] + q[2] * q[2])
          );
          const deg = ((heading * 180) / Math.PI + 360) % 360;
          buffer.current.push(deg);
          if (buffer.current.length > SMOOTHING) buffer.current.shift();
          if (buffer.current.length >= SMOOTHING) setHeading(averageAngles(buffer.current));
        });
        sensor.start();
        cleanupRef.current = () => sensor.stop();
        return;
      } catch {
        // Fall through to deviceorientation
      }
    }

    window.addEventListener("deviceorientationabsolute", handler as EventListener, true);
    window.addEventListener("deviceorientation", handler as EventListener, true);

    cleanupRef.current = () => {
      window.removeEventListener("deviceorientationabsolute", handler as EventListener, true);
      window.removeEventListener("deviceorientation", handler as EventListener, true);
    };
  };

  const requestPermission = async () => {
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
      setPermission("granted");
      startListening();
    } else {
      setPermission("unsupported");
    }
  };

  useEffect(() => {
    return () => { cleanupRef.current?.(); };
  }, []);

  const arrowRotation = heading !== null ? (heading - qiblaDegrees + 360) % 360 : 0;
  const isAligned = heading !== null && Math.abs((heading - qiblaDegrees + 360) % 360) < 10;
  const isLoading = permission === "granted" && heading === null;

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
          {/* Loading state while buffer fills */}
          {isLoading && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "1rem" }}>
              Calibrating compass… hold your phone flat and move it in a figure-8
            </p>
          )}

          {/* Compass ring */}
          <div style={{
            position: "relative", width: 160, height: 160, margin: "0 auto 1rem",
            opacity: isLoading ? 0.4 : 1, transition: "opacity 0.3s",
          }}>
            <svg width="160" height="160" viewBox="0 0 160 160" style={{ position: "absolute", inset: 0 }}>
              <circle cx="80" cy="80" r="76" fill="none" stroke="var(--border)" strokeWidth="1.5" />
              <circle cx="80" cy="80" r="60" fill="none" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 6" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
                const rad = (deg - 90) * Math.PI / 180;
                const isMajor = deg % 90 === 0;
                const r1 = isMajor ? 68 : 71;
                return (
                  <line
                    key={deg}
                    x1={80 + r1 * Math.cos(rad)} y1={80 + r1 * Math.sin(rad)}
                    x2={80 + 76 * Math.cos(rad)} y2={80 + 76 * Math.sin(rad)}
                    stroke={isMajor ? "var(--text-muted)" : "var(--border)"}
                    strokeWidth={isMajor ? 1.5 : 0.8}
                  />
                );
              })}
              {[
                { label: "N", deg: 0 },
                { label: "E", deg: 90 },
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

            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: `rotate(${arrowRotation}deg)`,
              transition: heading !== null ? "transform 0.15s ease-out" : "none",
            }}>
              <svg width="40" height="80" viewBox="0 0 40 80">
                <polygon
                  points="20,4 34,44 20,36 6,44"
                  fill={isAligned ? "#4ecd82" : "var(--gold)"}
                  style={{ transition: "fill 0.3s" }}
                />
                <polygon points="20,76 26,44 20,52 14,44" fill="var(--text-muted)" opacity="0.5" />
                <circle cx="20" cy="48" r="4" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1" />
              </svg>
            </div>

            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.1rem", pointerEvents: "none",
            }}>
              🕋
            </div>
          </div>

          <div style={{ marginTop: "0.5rem" }}>
            {isLoading ? null : isAligned ? (
              <p style={{ color: "#4ecd82", fontSize: "0.9rem", fontWeight: 600 }}>✓ Facing Qibla</p>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                Rotate until the arrow turns green
              </p>
            )}
          </div>

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