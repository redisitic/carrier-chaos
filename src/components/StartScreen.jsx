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
        <p className="start-sub">Centiro TMS Simulator</p>

        <div className="start-info">
          <div className="info-row">
            <span className="info-icon">🏢</span>
            <span>Manage 25 shipments as a Centiro TMS operator</span>
          </div>
          <div className="info-row">
            <span className="info-icon">🎯</span>
            <span>Choose the right carrier + service for each order</span>
          </div>
          <div className="info-row">
            <span className="info-icon">⏰</span>
            <span>Orders expire — assign carriers before time runs out</span>
          </div>
          <div className="info-row">
            <span className="info-icon">💰</span>
            <span>Start with ₹25,000 — optimize costs to survive</span>
          </div>
        </div>

        <div className="start-carriers">
          <div className="mini-carrier" style={{ borderColor: "#4D148C" }}>📦 FedEx — International Express</div>
          <div className="mini-carrier" style={{ borderColor: "#351C15" }}>🟤 UPS — US/EU Coverage</div>
          <div className="mini-carrier" style={{ borderColor: "#FFCC00" }}>✈️ DHL — Global Reach</div>
          <div className="mini-carrier" style={{ borderColor: "#E31E25" }}>🚛 Delhivery — India Domestic</div>
          <div className="mini-carrier" style={{ borderColor: "#003DA5" }}>🔵 Bluedart — India + DG</div>
          <div className="mini-carrier" style={{ borderColor: "#DC0018" }}>🇨🇭 Swiss Post — EU Economy</div>
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
