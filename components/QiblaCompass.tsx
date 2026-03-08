"use client";

import { useEffect, useRef, useState } from "react";

interface QiblaCompassProps {
  qiblaDegrees: number;
}

const SMOOTHING = 8;

function averageAngles(angles: number[]): number {
  const sinSum = angles.reduce((s, a) => s + Math.sin((a * Math.PI) / 180), 0);
  const cosSum = angles.reduce((s, a) => s + Math.cos((a * Math.PI) / 180), 0);
  return ((Math.atan2(sinSum / angles.length, cosSum / angles.length) * 180) / Math.PI + 360) % 360;
}

type PermissionState = "prompt" | "granted" | "denied" | "unsupported";

export default function QiblaCompass({ qiblaDegrees }: QiblaCompassProps) {
  const [heading, setHeading]       = useState<number | null>(null);
  const [permission, setPermission] = useState<PermissionState>("prompt");
  const [method, setMethod]         = useState<string>("");
  const buffer                      = useRef<number[]>([]);
  const cleanupRef                  = useRef<(() => void) | null>(null);

  // ── Strategy 1: Magnetometer + Accelerometer (most accurate, all modern Android) ──
  const tryMagnetometer = (): boolean => {
    try {
      const mag = new (window as any).Magnetometer({ frequency: 10 });
      const acc = new (window as any).Accelerometer({ frequency: 10 });

      let mx = 0, my = 0, mz = 0;
      let ax = 0, ay = 0, az = 0;

      mag.addEventListener("reading", () => { mx = mag.x; my = mag.y; mz = mag.z; });
      acc.addEventListener("reading", () => {
        ax = acc.x; ay = acc.y; az = acc.z;

        // Tilt-compensated compass heading
        const normA  = Math.sqrt(ax * ax + ay * ay + az * az);
        const axN    = ax / normA;
        const ayN    = ay / normA;

        const mx2    = mx * Math.cos(0) + mz * Math.sin(0); // simplified, phone held flat
        const by     = mx * ayN - my * axN;
        const bx     = mx * Math.cos(Math.asin(axN)) + my * axN * ayN + mz * ayN;

        const raw    = (Math.atan2(-by, bx) * 180 / Math.PI + 360) % 360;

        buffer.current.push(raw);
        if (buffer.current.length > SMOOTHING) buffer.current.shift();
        if (buffer.current.length >= SMOOTHING) setHeading(averageAngles(buffer.current));
      });

      mag.start();
      acc.start();
      setMethod("magnetometer");
      cleanupRef.current = () => { mag.stop(); acc.stop(); };
      return true;
    } catch {
      return false;
    }
  };

  // ── Strategy 2: deviceorientationabsolute (standardized Android, no manufacturer variance) ──
  const tryAbsoluteOrientation = (): boolean => {
    let fired = false;
    const timeout = setTimeout(() => {
      if (!fired) {
        // Event never fired — device doesn't support absolute
        window.removeEventListener("deviceorientationabsolute", handler as EventListener, true);
      }
    }, 1500);

    const handler = (e: DeviceOrientationEvent) => {
      if (!(e as any).absolute) return; // guard: some browsers fire this without absolute=true
      fired = true;
      clearTimeout(timeout);

      if (e.alpha === null) return;
      // deviceorientationabsolute alpha is ALWAYS counter-clockwise from true North — standardized
      const raw = (360 - e.alpha) % 360;

      buffer.current.push(raw);
      if (buffer.current.length > SMOOTHING) buffer.current.shift();
      if (buffer.current.length >= SMOOTHING) setHeading(averageAngles(buffer.current));
    };

    window.addEventListener("deviceorientationabsolute", handler as EventListener, true);
    setMethod("absolute");
    cleanupRef.current = () => {
      clearTimeout(timeout);
      window.removeEventListener("deviceorientationabsolute", handler as EventListener, true);
    };
    return true;
  };

  // ── Strategy 3: webkitCompassHeading (iOS) ──
  const tryWebkit = (e: DeviceOrientationEvent): number | null => {
    const wk = (e as any).webkitCompassHeading;
    if (wk == null) return null;
    // webkitCompassHeading is clockwise from North — directly usable
    return wk;
  };

  // ── Strategy 4: plain deviceorientation fallback ──
  // alpha increases counter-clockwise on most devices but clockwise on some
  // We detect which by checking if heading makes sense after a few readings
  const tryDeviceOrientation = () => {
    let alphaReadings: number[]  = [];
    let confirmed                = false;
    let invertAlpha              = false; // will be auto-detected

    const handler = (e: DeviceOrientationEvent) => {
      // Try webkit first
      const wk = tryWebkit(e);
      if (wk !== null) {
        buffer.current.push(wk);
        if (buffer.current.length > SMOOTHING) buffer.current.shift();
        if (buffer.current.length >= SMOOTHING) setHeading(averageAngles(buffer.current));
        setMethod("webkit");
        return;
      }

      if (e.alpha === null) return;

      if (!confirmed) {
        alphaReadings.push(e.alpha);

        // After 15 readings check if alpha and beta/gamma make physical sense
        // On a flat phone facing North: alpha≈0, beta≈0, gamma≈0
        // We can't auto-detect inversion without a reference so we just
        // use the W3C spec: alpha is clockwise from North → use (360-alpha)
        if (alphaReadings.length >= 15) {
          confirmed   = true;
          invertAlpha = true; // W3C spec says alpha is counter-clockwise, so invert for clockwise heading
          setMethod("deviceorientation");
        }
        return;
      }

      const raw = invertAlpha ? (360 - e.alpha) % 360 : e.alpha;
      buffer.current.push(raw);
      if (buffer.current.length > SMOOTHING) buffer.current.shift();
      if (buffer.current.length >= SMOOTHING) setHeading(averageAngles(buffer.current));
    };

    window.addEventListener("deviceorientation", handler as EventListener, true);
    cleanupRef.current = () =>
      window.removeEventListener("deviceorientation", handler as EventListener, true);
  };

  const startListening = () => {
    buffer.current = [];

    // Try strategies in order of reliability
    if ((window as any).Magnetometer && (window as any).Accelerometer) {
      if (tryMagnetometer()) return;
    }
    if ("ondeviceorientationabsolute" in window) {
      if (tryAbsoluteOrientation()) return;
    }
    // Falls back to deviceorientation (handles both iOS webkit and Android alpha)
    tryDeviceOrientation();
  };

  const requestPermission = async () => {
    // iOS 13+ needs explicit permission
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      try {
        const res = await (DeviceOrientationEvent as any).requestPermission();
        if (res === "granted") { setPermission("granted"); startListening(); }
        else setPermission("denied");
      } catch { setPermission("denied"); }
      return;
    }

    // Magnetometer permission (Chrome on Android)
    if ((window as any).Magnetometer) {
      try {
        const res = await navigator.permissions.query({ name: "magnetometer" as PermissionName });
        if (res.state === "denied") { setPermission("denied"); return; }
      } catch { /* ignore, just try */ }
    }

    if (window.DeviceOrientationEvent) {
      setPermission("granted");
      startListening();
    } else {
      setPermission("unsupported");
    }
  };

  useEffect(() => () => { cleanupRef.current?.(); }, []);

  const arrowRotation = heading !== null ? (qiblaDegrees - heading + 360) % 360 : 0;
  const isAligned     = heading !== null && Math.abs((qiblaDegrees - heading + 360) % 360) < 10;
  const isLoading     = permission === "granted" && heading === null;

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
        fontSize: "0.7rem", textTransform: "uppercase",
        letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: "1.25rem",
      }}>
        Qibla Direction
      </p>

      {permission === "prompt" && (
        <button onClick={requestPermission} style={{
          background: "var(--bg-elevated)", border: "1px solid var(--border-accent)",
          borderRadius: 10, padding: "0.6rem 1.4rem", color: "var(--gold)",
          fontSize: "0.9rem", cursor: "pointer", marginBottom: "1rem",
        }}>
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
          {isLoading && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "1rem" }}>
              Calibrating… hold your phone flat and move in a figure-8
            </p>
          )}

          <div style={{
            position: "relative", width: 160, height: 160, margin: "0 auto 1rem",
            opacity: isLoading ? 0.4 : 1, transition: "opacity 0.3s",
          }}>
            <svg width="160" height="160" viewBox="0 0 160 160" style={{ position: "absolute", inset: 0 }}>
              <circle cx="80" cy="80" r="76" fill="none" stroke="var(--border)" strokeWidth="1.5" />
              <circle cx="80" cy="80" r="60" fill="none" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 6" />
              {[0,45,90,135,180,225,270,315].map(deg => {
                const rad    = (deg - 90) * Math.PI / 180;
                const isMajor = deg % 90 === 0;
                return (
                  <line key={deg}
                    x1={80 + (isMajor ? 68 : 71) * Math.cos(rad)} y1={80 + (isMajor ? 68 : 71) * Math.sin(rad)}
                    x2={80 + 76 * Math.cos(rad)}                   y2={80 + 76 * Math.sin(rad)}
                    stroke={isMajor ? "var(--text-muted)" : "var(--border)"}
                    strokeWidth={isMajor ? 1.5 : 0.8}
                  />
                );
              })}
              {[{ label: "N", deg: 0 },{ label: "E", deg: 90 },{ label: "S", deg: 180 },{ label: "W", deg: 270 }]
                .map(({ label, deg }) => {
                  const rad = (deg - 90) * Math.PI / 180;
                  return (
                    <text key={label}
                      x={80 + 55 * Math.cos(rad)} y={80 + 55 * Math.sin(rad)}
                      textAnchor="middle" dominantBaseline="middle"
                      fill={label === "N" ? "var(--gold)" : "var(--text-muted)"}
                      fontSize="11" fontWeight={label === "N" ? "700" : "400"} fontFamily="monospace"
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
                <polygon points="20,4 34,44 20,36 6,44"
                  fill={isAligned ? "#4ecd82" : "var(--gold)"} style={{ transition: "fill 0.3s" }} />
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
            {!isLoading && (isAligned
              ? <p style={{ color: "#4ecd82", fontSize: "0.9rem", fontWeight: 600 }}>Facing Qibla</p>
              : <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Rotate until the arrow turns green</p>
            )}
          </div>

          {heading !== null && (
            <div style={{
              display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "1rem",
              fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-muted)",
            }}>
              <span>Qibla: <strong style={{ color: "var(--gold)" }}>{Math.round(qiblaDegrees)}°</strong></span>
              <span>Heading: <strong style={{ color: "var(--text-secondary)" }}>{Math.round(heading)}°</strong></span>
              <span style={{ fontSize: "0.7rem", opacity: 0.5 }}>{method}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}