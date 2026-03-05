"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  totalSeconds: number;
}

export default function CountdownTimer({ totalSeconds }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    setRemaining(totalSeconds);
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [totalSeconds]);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  const segments = [
    { value: h, label: "hrs" },
    { value: m, label: "min" },
    { value: s, label: "sec" },
  ];

  return (
    <div className="flex items-center justify-center gap-2">
      {segments.map(({ value, label }, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="countdown-segment">
            <span className="value">{String(value).padStart(2, "0")}</span>
            <span className="label">{label}</span>
          </div>
          {i < 2 && (
            <span className="text-[var(--gold)]/50 font-mono font-bold text-xl select-none">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}