import React from "react";
import { useGame } from "../context/GameContext";

export default function DailySummaryScreen() {
  const { state, dispatch } = useGame();

  // The most recent past day is the one that just finished
  const todayEntry = state.pastDays[state.pastDays.length - 1];
  if (!todayEntry) return null;

  const { day, points, stats } = todayEntry;

  const handleNextDay = () => {
    dispatch({ type: "START_NEXT_DAY" });
  };

  return (
    <div className="screen summary-screen">
      <div className="summary-card">
        <h2 className="summary-title">🌙 End of Day {day}</h2>
        <p className="summary-sub">Warehouse operations have paused for the night.</p>

        <div className="summary-stats">
          <div className="stat-box" style={{ borderColor: "rgba(34, 197, 94, 0.3)" }}>
            <span className="stat-label">Daily Points</span>
            <span className="stat-value" style={{ color: points >= 0 ? "#22c55e" : "#ef4444" }}>
              {points > 0 ? "+" : ""}{points}
            </span>
          </div>

          <div className="stat-box">
            <span className="stat-label">Delivered Today</span>
            <span className="stat-value" style={{ color: "#38bdf8" }}>{stats.delivered}</span>
          </div>

          <div className="stat-box" style={{ borderColor: "rgba(239, 68, 68, 0.3)" }}>
            <span className="stat-label">Failed / Issues</span>
            <span className="stat-value" style={{ color: stats.failed > 0 ? "#ef4444" : "#94a3b8" }}>
              {stats.failed}
            </span>
          </div>

          <div className="stat-box" style={{ borderColor: "rgba(245, 158, 11, 0.3)" }}>
            <span className="stat-label">Expired</span>
            <span className="stat-value" style={{ color: stats.expired > 0 ? "#f59e0b" : "#94a3b8" }}>
              {stats.expired}
            </span>
          </div>
        </div>

        <div className="summary-breakdown">
          <h3>Performance Insights</h3>
          <ul>
            <li>
              <strong>Cost Efficiency:</strong> You selected the cheapest valid carrier {stats.costEfficient} times today.
            </li>
            {stats.failed > 0 && (
              <li style={{ color: "#ef4444" }}>
                <strong>Quality Alert:</strong> {stats.failed} shipments experienced exceptions or delivery failure. Be careful with unreliable carriers and DG mismatches.
              </li>
            )}
            {points < 0 && (
              <li style={{ color: "#f59e0b" }}>
                <strong>Cost Control:</strong> You lost points overall today. Ensure you are not overspending on premium services for slow orders or violating Service Level Agreements.
              </li>
            )}
            {points >= 100 && (
              <li style={{ color: "#22c55e" }}>
                <strong>Excellent Work:</strong> A highly profitable day! Great carrier determination.
              </li>
            )}
          </ul>
        </div>

        <button className="primary-btn pulse-glow" onClick={handleNextDay}>
          Start Day {day + 1} ☀️
        </button>
      </div>

      <style>{`
        .summary-screen {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
        }
        .summary-card {
          background: #1e293b;
          border: 1px solid #334155;
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
