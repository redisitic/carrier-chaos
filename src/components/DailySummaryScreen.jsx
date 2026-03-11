import React, { useEffect, useRef } from "react";
import { useGame } from "../context/GameContext";
import indianSong from "../assets/indian-song.mp3";

export default function DailySummaryScreen() {
  const { state, dispatch } = useGame();
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(indianSong);
    audio.loop = true;
    audio.volume = 0.6;
    audio.play().catch(() => {});
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  // The most recent past day is the one that just finished
  const todayEntry = state.pastDays[state.pastDays.length - 1];
  if (!todayEntry) return null;

  const { day, points, stats, moneyEarned = 0 } = todayEntry;

  const handleNextDay = () => {
    dispatch({ type: "START_NEXT_DAY" });
  };

  return (
    <div className="screen summary-screen">
      <div className="summary-card">
        <h2 className="summary-title">🌇 End of Shift {day}</h2>
        <p className="summary-sub">Shift closed — 5:00 PM. Review this shift’s performance before the next one.</p>

        <div className="summary-stats">
          <div className="stat-box" style={{ borderColor: "rgba(34, 197, 94, 0.3)" }}>
            <span className="stat-label">Daily Points</span>
            <span className="stat-value" style={{ color: points >= 0 ? "#22c55e" : "#ef4444" }}>
              {points > 0 ? "+" : ""}{points}
            </span>
          </div>

          <div className="stat-box" style={{ borderColor: "rgba(245, 158, 11, 0.3)" }}>
            <span className="stat-label">💰 Shift Earnings</span>
            <span className="stat-value" style={{ color: moneyEarned > 0 ? "#f59e0b" : "#64748b" }}>
              {moneyEarned > 0 ? `₹${moneyEarned.toLocaleString()}` : "₹0"}
            </span>
            <span style={{ fontSize: "0.65rem", color: "#64748b", marginTop: "-0.25rem" }}>
              {points} pts × ₹15
            </span>
          </div>

          <div className="stat-box">
            <span className="stat-label">Delivered This Shift</span>
            <span className="stat-value" style={{ color: "#38bdf8" }}>{stats.delivered}</span>
          </div>

          <div className="stat-box" style={{ borderColor: "rgba(239, 68, 68, 0.3)" }}>
            <span className="stat-label">Failed / Issues</span>
            <span className="stat-value" style={{ color: (stats.failed + stats.expired) > 0 ? "#ef4444" : "#94a3b8" }}>
              {stats.failed + stats.expired}
            </span>
            {(stats.failed > 0 || stats.expired > 0) && (
              <span style={{ fontSize: "0.65rem", color: "#64748b", marginTop: "-0.25rem" }}>
                {stats.failed} carrier · {stats.expired} expired
              </span>
            )}
          </div>

          <div className="stat-box" style={{ borderColor: "rgba(99, 102, 241, 0.3)" }}>
            <span className="stat-label">Still In Transit</span>
            <span className="stat-value" style={{ color: "#818cf8" }}>
              {state.activeDeliveries.length}
            </span>
          </div>
        </div>

        <div className="summary-breakdown">
          <h3>Performance Insights</h3>
          <ul>
            <li>
              <strong>Cost Efficiency:</strong> You selected the cheapest valid carrier {stats.costEfficient} times this shift.
            </li>
            {stats.failed > 0 && (
              <li style={{ color: "#ef4444" }}>
                <strong>Quality Alert:</strong> {stats.failed} shipments experienced exceptions or delivery failure. Be careful with unreliable carriers and DG mismatches.
              </li>
            )}
            {points < 0 && (
              <li style={{ color: "#f59e0b" }}>
                <strong>Cost Control:</strong> You lost points this shift. Ensure you are not overspending on premium services for slow orders or violating Service Level Agreements.
              </li>
            )}
            {points >= 100 && (
              <li style={{ color: "#22c55e" }}>
                <strong>Excellent Work:</strong> A highly profitable shift! Great carrier determination.
              </li>
            )}
          </ul>
        </div>

        <button className="primary-btn pulse-glow" onClick={handleNextDay}>
          Begin Shift {day + 1} ☀️
        </button>
      </div>

      <style>{`
        .summary-screen {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: #000000;
        }
        .summary-card {
          background: #0d0d0d;
          border: 1px solid #222222;
          border-radius: 12px;
          padding: 2rem;
          width: 100%;
          max-width: 600px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .summary-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f8fafc;
          margin: 0;
          text-align: center;
        }
        .summary-sub {
          color: #94a3b8;
          text-align: center;
          margin: -1rem 0 0 0;
          font-size: 0.95rem;
        }
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        .summary-stats > :first-child,
        .summary-stats > :nth-child(2) {
          grid-column: span 1;
        }
        .stat-box {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .stat-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1;
        }
        .summary-breakdown {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 8px;
          padding: 1.5rem;
        }
        .summary-breakdown h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          color: #e2e8f0;
        }
        .summary-breakdown ul {
          margin: 0;
          padding-left: 1.2rem;
          color: #cbd5e1;
          font-size: 0.95rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .pulse-glow {
          margin-top: 1rem;
          padding: 1rem;
          font-size: 1.1rem;
          animation: pulse-border 2s infinite;
        }
        @keyframes pulse-border {
          0% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(14, 165, 233, 0); }
          100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
        }
      `}</style>
    </div>
  );
}
