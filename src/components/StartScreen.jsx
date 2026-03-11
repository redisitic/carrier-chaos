import { useState } from "react";
import { useGame } from "../context/GameContext";
import LeaderboardScreen from "./LeaderboardScreen";

export default function StartScreen() {
  const { dispatch } = useGame();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  return (
    <div className="screen start-screen">
      <div className="start-card">
        <div className="start-logo">📦</div>
        <h1 className="start-title">CarrierChaos</h1>
        <p className="start-sub">Delivery Simulation Game</p>

        <div className="start-info">
          <div className="info-row">
            <span className="info-icon">🏭</span>
            <span>Manage 20 shipments from your warehouse</span>
          </div>
          <div className="info-row">
            <span className="info-icon">🚚</span>
            <span>Pick the right carrier for each terrain</span>
          </div>
          <div className="info-row">
            <span className="info-icon">⚡</span>
            <span>Beat the clock and avoid anomalies</span>
          </div>
          <div className="info-row">
            <span className="info-icon">💰</span>
            <span>Start with $1,000 — don't go broke</span>
          </div>
        </div>

        <div className="start-carriers">
          <div className="mini-carrier" style={{ borderColor: "#3b82f6" }}>🚚 CityExpress — Fast, Urban</div>
          <div className="mini-carrier" style={{ borderColor: "#22c55e" }}>🌿 EcoShip — Cheap, Urban/Rugged</div>
          <div className="mini-carrier" style={{ borderColor: "#f97316" }}>⛰️ MountainGo — Mountain, 24h</div>
          <div className="mini-carrier" style={{ borderColor: "#06b6d4" }}>🚢 RiverLine — Waterway, 24h</div>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            className="btn-primary btn-large"
            onClick={() => dispatch({ type: "START_GAME" })}
          >
            Start Simulation
          </button>
          <button
            className="btn-primary btn-large"
            style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)" }}
            onClick={() => setShowLeaderboard(true)}
          >
            🏅 Leaderboard
          </button>
        </div>
      </div>
      {showLeaderboard && (
        <LeaderboardScreen onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  );
}
