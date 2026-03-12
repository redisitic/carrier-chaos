import { useState } from "react";
import { useGame } from "../context/GameContext";
import LeaderboardScreen from "./LeaderboardScreen";
import CarrierLogo from "./CarrierLogo";

export default function StartScreen() {
  const { dispatch } = useGame();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <div className="screen start-screen">
      <div className="start-card">
        {/* Logo */}
        <img src="/dark-transparent.svg" alt="CarrierChaos Logo" className="start-logo-img" />

        <h1 className="start-title">CarrierChaos</h1>

        {/* Primary action buttons */}
        <div className="start-actions">
          <button
            className="btn-primary btn-large"
            onClick={() => dispatch({ type: "START_GAME" })}
          >
            ▶ Start Simulation
          </button>
          <button
            className="btn-secondary btn-large"
            onClick={() => setShowLeaderboard(true)}
          >
            Leaderboard
          </button>
          <button
            className="btn-ghost btn-large"
            onClick={() => setShowHowToPlay(o => !o)}
          >
            {showHowToPlay ? "▲ Hide Guide" : "How to Play"}
          </button>
        </div>

        {/* How to Play accordion */}
        {showHowToPlay && (
          <div className="how-to-play">
            <div className="htp-section">
              <h3 className="htp-heading">How It Works</h3>
              <ul className="htp-list">
                <li>🎯 Choose the right carrier &amp; service for each incoming order</li>
                <li>⏰ Orders expire — assign carriers before time runs out</li>
                <li>💰 Start with ₹25,000 — optimize costs to survive each shift</li>
              </ul>
            </div>
            <div className="htp-section">
              <h3 className="htp-heading">Carriers</h3>
              <div className="htp-carriers">
                <div className="htp-carrier" style={{ borderColor: "#4D148C" }}><CarrierLogo name="FedEx" size={16} /> <strong>FedEx</strong> — Premium express, reliable</div>
                <div className="htp-carrier" style={{ borderColor: "#351C15" }}><CarrierLogo name="UPS" size={16} /> <strong>UPS</strong> — Solid ground &amp; air coverage</div>
                <div className="htp-carrier" style={{ borderColor: "#FFCC00" }}><CarrierLogo name="DHL" size={16} /> <strong>DHL</strong> — Best for international air</div>
                <div className="htp-carrier" style={{ borderColor: "#E31E25" }}><CarrierLogo name="Delhivery" size={16} /> <strong>Delhivery</strong> — Budget domestic ground</div>
                <div className="htp-carrier" style={{ borderColor: "#003DA5" }}><CarrierLogo name="Bluedart" size={16} /> <strong>Bluedart</strong> — Fast domestic air</div>
                <div className="htp-carrier" style={{ borderColor: "#DC0018" }}><CarrierLogo name="Maersk" size={16} /> <strong>Maersk</strong> — Bulk ocean freight</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showLeaderboard && (
        <LeaderboardScreen onClose={() => setShowLeaderboard(false)} />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');

        .start-logo-img {
          width: 250px;
          height: auto;
          object-fit: contain;
        }

        .start-title {
          font-family: 'Nunito', 'Proxima Nova', 'Segoe UI', system-ui, sans-serif;
          font-weight: 900;
          font-size: 2.2rem;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .start-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text);
          border-radius: var(--radius);
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          padding: 10px 20px;
        }
        .btn-secondary:hover {
          background: var(--surface2);
          border-color: var(--text-muted);
        }

        .btn-ghost {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-muted);
          border-radius: var(--radius);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s;
          padding: 8px 20px;
        }
        .btn-ghost:hover { color: var(--text); }

        .how-to-play {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-top: 1px solid var(--border);
          padding-top: 14px;
          animation: htpFade 0.2s ease;
        }
        @keyframes htpFade { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

        .htp-heading {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin: 0 0 8px 0;
        }

        .htp-list {
          margin: 0;
          padding-left: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          color: var(--text);
        }

        .htp-carriers {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }

        .htp-carrier {
          padding: 6px 10px;
          border: 1px solid;
          border-radius: var(--radius-sm);
          font-size: 11px;
          background: var(--surface2);
          color: var(--text);
        }
      `}</style>
    </div>
  );
}
