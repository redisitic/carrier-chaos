import { useGame } from "../context/GameContext";
import { xpLevel } from "../game/logic";

function formatTime(gameMinutes) {
  const h = Math.floor(gameMinutes / 60) % 24;
  const m = gameMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function HUD() {
  const { state, dispatch } = useGame();
  const { money, xp, points, stats, warehouseQueue, activeDeliveries, gameMinutes, day, running, phase } = state;
  const { level, title } = xpLevel(xp);

  return (
    <div className="hud">
      <div className="hud-top">
        <div className="hud-brand">
          <span className="hud-logo">📦</span>
          <span className="hud-title">CarrierChaos</span>
        </div>

        <div className="hud-clock">
          <span className="clock-day">Day {day}</span>
          <span className="clock-time">{formatTime(gameMinutes)}</span>
        </div>

        <div className="hud-nav">
          <button
            className={`nav-btn ${state.screen === "warehouse" ? "active" : ""}`}
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "warehouse" })}
          >
            Warehouse
          </button>
          <button
            className={`nav-btn ${state.screen === "tracking" ? "active" : ""}`}
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "tracking" })}
          >
            Tracking
          </button>
          <button
            className={`nav-btn ${state.screen === "stats" ? "active" : ""}`}
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "stats" })}
          >
            Stats
          </button>
        </div>

        <div className="hud-controls">
          {phase === "playing" && (
            <button
              className={`pause-btn ${running ? "" : "paused"}`}
              onClick={() => dispatch({ type: "TOGGLE_PAUSE" })}
            >
              {running ? "⏸ Pause" : "▶ Resume"}
            </button>
          )}
        </div>
      </div>

      <div className="hud-bar">
        <div className="hud-stat">
          <span className="stat-label">Funds</span>
          <span className={`stat-value ${money < 100 ? "danger" : money < 300 ? "warning" : "good"}`}>
            ${money}
          </span>
        </div>
        <div className="hud-stat">
          <span className="stat-label">XP</span>
          <span className="stat-value">{xp} <small className="xp-title">Lv.{level} {title}</small></span>
        </div>
        <div className="hud-stat">
          <span className="stat-label">Points</span>
          <span className="stat-value points">{points}</span>
        </div>
        <div className="hud-divider" />
        <div className="hud-stat">
          <span className="stat-label">Completed</span>
          <span className="stat-value">{stats.totalDelivered}</span>
        </div>
        <div className="hud-stat">
          <span className="stat-label">In Transit</span>
          <span className="stat-value">{activeDeliveries.length}</span>
        </div>
        <div className="hud-stat">
          <span className="stat-label">Queue</span>
          <span className="stat-value">{warehouseQueue.length}</span>
        </div>
        <div className="hud-stat">
          <span className="stat-label">Anomalies</span>
          <span className={`stat-value ${stats.totalAnomalies > 0 ? "warning" : ""}`}>
            {stats.totalAnomalies}
          </span>
        </div>
        <div className="hud-stat">
          <span className="stat-label">Failed</span>
          <span className={`stat-value ${stats.totalFailed > 0 ? "danger" : ""}`}>
            {stats.totalFailed} / 5
          </span>
        </div>
      </div>
    </div>
  );
}
