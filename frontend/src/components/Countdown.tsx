import { useEffect, useState } from "react";

interface CountdownProps {
  approvedDate: string; // ISO — when the borrow was approved / reservation confirmed
  type: "borrow" | "reservation";
}

const FINE_PER_DAY = 50;
const DEADLINE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

function pad(n: number) { return String(n).padStart(2, "0"); }

export function Countdown({ approvedDate, type }: CountdownProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const start = new Date(approvedDate).getTime();
  const deadline = start + DEADLINE_MS;
  const remaining = deadline - now;
  const isOverdue = remaining <= 0;

  // ── On time: countdown from 7 days ──────────────────────────────────────
  const remSec = Math.max(0, Math.floor(remaining / 1000));
  const remDays = Math.floor(remSec / 86400);
  const remHrs  = Math.floor((remSec % 86400) / 3600);
  const remMins = Math.floor((remSec % 3600) / 60);
  const remSecs = remSec % 60;
  const progress = Math.min(100, ((now - start) / DEADLINE_MS) * 100);

  const barColor = isOverdue
    ? "#ef4444"
    : progress > 85 ? "#f97316"
    : progress > 60 ? "#eab308"
    : "#22c55e";

  // ── Overdue: count UP + running fine ────────────────────────────────────
  const overdueMs   = Math.max(0, now - deadline);
  const overdueSec  = Math.floor(overdueMs / 1000);
  const overdueDaysExact = overdueMs / (1000 * 60 * 60 * 24);
  const overdueDaysFull  = Math.floor(overdueDaysExact); // full days for fine
  const runningFine = overdueDaysFull * FINE_PER_DAY;
  // fractional progress toward next ₱50 charge
  const nextFineProgress = (overdueDaysExact - overdueDaysFull) * 100;

  const ovHrs  = Math.floor((overdueSec % 86400) / 3600);
  const ovMins = Math.floor((overdueSec % 3600) / 60);
  const ovSecs = overdueSec % 60;

  if (isOverdue) {
    return (
      <div style={{
        background: "#1a0a0a",
        border: "1px solid #ef444444",
        padding: "16px",
        marginTop: "12px",
        boxShadow: "0 0 20px #ef444411",
      }}>
        {/* Overdue header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
          <div>
            <p style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "9px", color: "#ef4444", letterSpacing: "3px", margin: "0 0 4px 0" }}>
              ⚠ {type.toUpperCase()} — OVERDUE
            </p>
            <p style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "10px", color: "#64748b", margin: 0 }}>
              7-day window expired · ₱{FINE_PER_DAY}/day
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "28px",
              color: "#ef4444",
              letterSpacing: "2px",
              margin: 0,
              textShadow: "0 0 16px #ef444477",
            }}>
              +{overdueDaysFull}D {pad(ovHrs)}:{pad(ovMins)}:{pad(ovSecs)}
            </p>
            <p style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "11px", color: "#f97316", margin: "2px 0 0 0" }}>
              FINE: ₱{runningFine.toFixed(2)} and counting...
            </p>
          </div>
        </div>

        {/* Progress toward next ₱50 charge */}
        <div style={{ marginBottom: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "8px", color: "#64748b" }}>
              DAY {overdueDaysFull} FINE CHARGED
            </span>
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "8px", color: "#f97316" }}>
              +₱{FINE_PER_DAY} in {pad(Math.floor((1 - nextFineProgress / 100) * 24))}h {pad(Math.floor(((1 - nextFineProgress / 100) * 24 * 60) % 60))}m
            </span>
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "8px", color: "#64748b" }}>
              DAY {overdueDaysFull + 1}
            </span>
          </div>
          <div style={{ background: "#2a0a0a", height: "6px", borderRadius: "1px", overflow: "hidden" }}>
            <div style={{
              width: `${nextFineProgress}%`,
              height: "100%",
              background: "#f97316",
              boxShadow: "0 0 8px #f9731666",
              transition: "width 1s linear",
            }} />
          </div>
        </div>

        <p style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "9px", color: "#ef444466", margin: "8px 0 0 0", letterSpacing: "1px" }}>
          TOTAL ACCRUED: ₱{runningFine.toFixed(2)} · RETURNS WILL CALCULATE FINAL FINE
        </p>
      </div>
    );
  }

  // ── On time countdown ─────────────────────────────────────────────────────
  return (
    <div style={{
      background: "#1a2a1a",
      border: `1px solid ${barColor}33`,
      padding: "16px",
      marginTop: "12px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
        <div>
          <p style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "9px", color: barColor, letterSpacing: "3px", margin: "0 0 4px 0" }}>
            ✓ {type.toUpperCase()} — ON TIME
          </p>
          <p style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "10px", color: "#64748b", margin: 0 }}>
            7-day window · return before deadline to avoid fines
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "28px",
            color: barColor,
            letterSpacing: "2px",
            margin: 0,
          }}>
            {remDays}D {pad(remHrs)}:{pad(remMins)}:{pad(remSecs)}
          </p>
          <p style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "10px", color: "#64748b", margin: "2px 0 0 0" }}>
            remaining before fine
          </p>
        </div>
      </div>

      {/* 7-day progress bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "8px", color: "#334155" }}>BORROWED</span>
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "8px", color: "#334155" }}>
            {Math.round(progress)}% of 7 days used
          </span>
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "8px", color: "#334155" }}>7-DAY LIMIT</span>
        </div>
        <div style={{ background: "#141a24", height: "6px", borderRadius: "1px", overflow: "hidden" }}>
          <div style={{
            width: `${progress}%`,
            height: "100%",
            background: barColor,
            boxShadow: `0 0 8px ${barColor}66`,
            transition: "width 1s linear",
          }} />
        </div>
      </div>
    </div>
  );
}