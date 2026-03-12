import React, { useEffect, useRef, useState } from "react";
import { useGame } from "../context/GameContext";
import indianSong from "../assets/indian-song.mp3";
import { saveScore, isHighScore } from "../game/storage";
import { useAudio } from "../hooks/useAudio";

export default function DailySummaryScreen() {
  const { state, dispatch } = useGame();
  const { muted } = useAudio();
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(indianSong);
    audio.loop = true;
    audio.volume = 0.6;
    audio.muted = muted;
    audio.play().catch(() => {});
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  const [showLBModal, setShowLBModal] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // The most recent past day is the one that just finished
  const todayEntry = state.pastDays[state.pastDays.length - 1];
  if (!todayEntry) return null;

  const { day, points, stats, moneyEarned = 0 } = todayEntry;

  const handleSubmitScore = async () => {
    const name = playerName.trim() || "Anonymous";
    const lowerName = name.toLowerCase();
    if (lowerName === "thomas" || lowerName === "tom") {
      dispatch({ type: "SET_TOAST", toast: "😊 Is it you?" });
    }
    await saveScore({ name, points, delivered: stats.delivered, shift: day, moneyEarned });
    setSubmitted(true);
  };

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
            <span className="summary-stat-value" style={{ color: points >= 0 ? "#22c55e" : "#ef4444" }}>
              {points > 0 ? "+" : ""}{points}
            </span>
          </div>

          <div className="stat-box" style={{ borderColor: "rgba(245, 158, 11, 0.3)" }}>
            <span className="stat-label">💰 Shift Earnings</span>
            <span className="summary-stat-value" style={{ color: moneyEarned > 0 ? "#f59e0b" : "#64748b" }}>
              {moneyEarned > 0 ? `₹${moneyEarned.toLocaleString()}` : "₹0"}
            </span>
            <span style={{ fontSize: "0.65rem", color: "#64748b", marginTop: "-0.25rem" }}>
              {points} pts × ₹15
            </span>
          </div>

          <div className="stat-box">
            <span className="stat-label">Delivered This Shift</span>
            <span className="summary-stat-value" style={{ color: "#38bdf8" }}>{stats.delivered}</span>
          </div>

          <div className="stat-box" style={{ borderColor: "rgba(239, 68, 68, 0.3)" }}>
            <span className="stat-label">Failed / Issues</span>
            <span className="summary-stat-value" style={{ color: (stats.failed + stats.expired) > 0 ? "#ef4444" : "#94a3b8" }}>
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
            <span className="summary-stat-value" style={{ color: "#818cf8" }}>
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

        <div className="summary-actions">
          {!submitted && (
            <button className="lb-submit-btn" onClick={() => setShowLBModal(true)}>
              🏅 Add to Leaderboard
            </button>
          )}
          {submitted && (
            <span className="lb-submitted-tag">✅ Score submitted!</span>
          )}
          <button className="primary-btn pulse-glow" onClick={handleNextDay}>
            Begin Shift {day + 1} ☀️
          </button>
        </div>

        {/* Leaderboard submission overlay */}
        {showLBModal && (
          <div className="lb-modal-backdrop" onClick={() => setShowLBModal(false)}>
            <div className="lb-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="lb-modal-title">🏅 Submit to Leaderboard</h3>
              <div className="lb-score-preview">
                <div className="lb-preview-row">
                  <span>Shift</span><strong>#{day}</strong>
                </div>
                <div className="lb-preview-row">
                  <span>Points</span><strong style={{ color: "#22c55e" }}>{points > 0 ? `+${points}` : points}</strong>
                </div>
                <div className="lb-preview-row">
                  <span>Delivered</span><strong style={{ color: "#38bdf8" }}>{stats.delivered}</strong>
                </div>
                <div className="lb-preview-row">
                  <span>Earnings</span><strong style={{ color: "#f59e0b" }}>₹{moneyEarned.toLocaleString()}</strong>
                </div>
              </div>
              <label className="lb-name-label">Your Name</label>
              <input
                className="lb-name-input"
                type="text"
                maxLength={24}
                placeholder="Enter your name..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitScore()}
                autoFocus
              />
              <div className="lb-modal-actions">
                <button className="lb-cancel-btn" onClick={() => setShowLBModal(false)}>Cancel</button>
                <button className="lb-confirm-btn" onClick={() => { handleSubmitScore(); setShowLBModal(false); }}>
                  Submit Score
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .summary-screen {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: calc(var(--hud-h) + 1.5rem) 1.5rem 1.5rem;
          background: #000000;
          min-height: 100%;
          overflow-y: auto;
        }
        .summary-card {
          background: #0d0d0d;
          border: 1px solid #222222;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          width: 100%;
          max-width: 580px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .summary-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #f8fafc;
          margin: 0;
          text-align: center;
        }
        .summary-sub {
          color: #94a3b8;
          text-align: center;
          margin: -0.5rem 0 0 0;
          font-size: 0.82rem;
        }
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.6rem;
        }
        .summary-stats > :first-child,
        .summary-stats > :nth-child(2) {
          grid-column: span 1;
        }
        .stat-box {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 0.65rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
        }
        .stat-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .summary-stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1;
        }
        .summary-breakdown {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 8px;
          padding: 0.9rem;
        }
        .summary-breakdown h3 {
          margin: 0 0 0.6rem 0;
          font-size: 0.9rem;
          color: #e2e8f0;
        }
        .summary-breakdown ul {
          margin: 0;
          padding-left: 1rem;
          color: #cbd5e1;
          font-size: 0.82rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .pulse-glow {
          margin-top: 0.5rem;
          padding: 0.7rem;
          font-size: 0.95rem;
          animation: pulse-border 2s infinite;
        }
        @keyframes pulse-border {
          0% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(14, 165, 233, 0); }
          100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
        }
        .summary-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .lb-submit-btn {
          background: linear-gradient(135deg, rgba(245,158,11,0.18), rgba(99,102,241,0.18));
          border: 1px solid rgba(245,158,11,0.5);
          color: #fbbf24;
          font-size: 1rem;
          font-weight: 700;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .lb-submit-btn:hover {
          background: linear-gradient(135deg, rgba(245,158,11,0.3), rgba(99,102,241,0.28));
          border-color: rgba(245,158,11,0.8);
          box-shadow: 0 0 14px rgba(245,158,11,0.3);
        }
        .lb-submitted-tag {
          text-align: center;
          color: #22c55e;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 0.5rem;
        }
        /* Modal */
        .lb-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.75);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lb-modal {
          background: #0d0d0d;
          border: 1px solid #334155;
          border-radius: 14px;
          padding: 2rem;
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          box-shadow: 0 25px 60px rgba(0,0,0,0.7);
          animation: lbModalIn 0.25s ease;
        }
        @keyframes lbModalIn { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        .lb-modal-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f8fafc;
          margin: 0;
          text-align: center;
        }
        .lb-score-preview {
          background: rgba(15,23,42,0.8);
          border: 1px solid #1e293b;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .lb-preview-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.95rem;
          color: #94a3b8;
        }
        .lb-preview-row strong { color: #f8fafc; }
        .lb-name-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .lb-name-input {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
          color: #f8fafc;
          font-size: 1rem;
          padding: 0.65rem 0.9rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .lb-name-input:focus { border-color: #6366f1; }
        .lb-modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }
        .lb-cancel-btn {
          background: transparent;
          border: 1px solid #334155;
          color: #94a3b8;
          border-radius: 8px;
          padding: 0.55rem 1.1rem;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.15s;
        }
        .lb-cancel-btn:hover { border-color: #64748b; color: #f8fafc; }
        .lb-confirm-btn {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          color: #fff;
          border-radius: 8px;
          padding: 0.55rem 1.2rem;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 700;
          transition: opacity 0.15s;
        }
        .lb-confirm-btn:hover { opacity: 0.85; }
      `}</style>
    </div>
  );
}
