import { useState } from "react";
import { useGame } from "../context/GameContext";
import { SPEED_OPTIONS } from "../game/constants";

export default function DebugPanel() {
  const { state, dispatch } = useGame();
  const [open, setOpen] = useState(false);

  const adjustTime = (delta) => dispatch({ type: "ADJUST_TIME", deltaMinutes: delta });
  const setSpeed   = (i)     => dispatch({ type: "SET_SPEED", speedIndex: i });

  return (
    <>
      {/* Toggle Button */}
      <button
        className="debug-toggle-btn"
        onClick={() => setOpen((o) => !o)}
        title="Debug Panel"
      >
        🛠 Debug
      </button>

      {open && (
        <div className="debug-panel">
          <div className="debug-panel-header">
            <span>🛠 Debug Panel</span>
            <button className="debug-close-btn" onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* ── Time Skip ── */}
          <div className="debug-section">
            <div className="debug-section-label">Time Skip</div>
            <div className="debug-btn-row">
              <button className="debug-btn debug-btn-add" onClick={() => adjustTime(-120)}>−2h</button>
              <button className="debug-btn debug-btn-add" onClick={() => adjustTime(-60)}>−1h</button>
              <button className="debug-btn debug-btn-add" onClick={() => adjustTime(60)}>+1h</button>
              <button className="debug-btn debug-btn-add" onClick={() => adjustTime(120)}>+2h</button>
            </div>
          </div>

          {/* ── Day Control ── */}
          <div className="debug-section">
            <div className="debug-section-label">Day Control</div>
            <div className="debug-btn-row">
              <button
                className="debug-btn debug-btn-day"
                onClick={() => dispatch({ type: "RESTART_DAY" })}
              >
                🔄 Restart Day
              </button>
              <button
                className="debug-btn debug-btn-end"
                onClick={() => dispatch({ type: "END_DAY_NOW" })}
              >
                🌇 End Day
              </button>
            </div>
          </div>

          {/* ── Speed ── */}
          <div className="debug-section">
            <div className="debug-section-label">Speed</div>
            <div className="debug-btn-row">
              {SPEED_OPTIONS.map((opt, i) => (
                <button
                  key={opt.label}
                  className={`debug-btn debug-btn-speed ${state.speedIndex === i ? "active" : ""}`}
                  onClick={() => setSpeed(i)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .debug-toggle-btn {
          background: #1a1a2e;
          color: #f59e0b;
          border: 1px solid #f59e0b44;
          border-radius: 6px;
          padding: 0.3rem 0.7rem;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          white-space: nowrap;
        }
        .debug-toggle-btn:hover {
          background: #f59e0b22;
          border-color: #f59e0b;
        }

        .debug-panel {
          position: fixed;
          top: 72px;
          right: 16px;
          z-index: 9000;
          background: #0a0a0f;
          border: 1px solid #f59e0b55;
          border-radius: 10px;
          padding: 0;
          min-width: 260px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.7), 0 0 16px rgba(245,158,11,0.1);
          font-family: inherit;
        }

        .debug-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.65rem 1rem;
          border-bottom: 1px solid #f59e0b33;
          font-size: 0.85rem;
          font-weight: 700;
          color: #f59e0b;
          letter-spacing: 0.04em;
        }

        .debug-close-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          font-size: 1rem;
          line-height: 1;
          padding: 0 0.2rem;
          transition: color 0.15s;
        }
        .debug-close-btn:hover { color: #ef4444; }

        .debug-section {
          padding: 0.7rem 1rem;
          border-bottom: 1px solid #1e293b;
        }
        .debug-section:last-child { border-bottom: none; }

        .debug-section-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.5rem;
        }

        .debug-btn-row {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .debug-btn {
          flex: 1;
          min-width: 52px;
          padding: 0.45rem 0.5rem;
          border-radius: 6px;
          border: 1px solid #334155;
          background: #111827;
          color: #cbd5e1;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .debug-btn:hover { background: #1e293b; border-color: #475569; color: #f8fafc; }

        .debug-btn-add { color: #38bdf8; border-color: #38bdf822; }
        .debug-btn-add:hover { background: #0c4a6e44; border-color: #38bdf8; }

        .debug-btn-day { color: #a78bfa; border-color: #7c3aed33; }
        .debug-btn-day:hover { background: #4c1d9544; border-color: #7c3aed; }

        .debug-btn-end { color: #fb923c; border-color: #c2410c33; }
        .debug-btn-end:hover { background: #7c2d1244; border-color: #fb923c; }

        .debug-btn-speed.active {
          background: #f59e0b22;
          border-color: #f59e0b;
          color: #f59e0b;
        }
      `}</style>
    </>
  );
}
