import { useGame } from "../context/GameContext";
import { xpLevel } from "../game/logic";
import { SPEED_OPTIONS } from "../game/constants";
import { useAudio } from "../hooks/useAudio";

function formatTime(gameMinutes) {
  const h = Math.floor(gameMinutes / 60) % 24;
  const m = gameMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function HUD() {
  const { state, dispatch } = useGame();
  const { money, xp, points, stats, warehouseQueue, activeDeliveries, gameMinutes, day, running, phase, weather, speedIndex } = state;
  const { level, title } = xpLevel(xp);
  const { muted, toggleMute } = useAudio();

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
            className={`nav-btn ${state.screen === "map" ? "active" : ""}`}
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "map" })}
          >
            🗺️ 3D Map
          </button>
          <button
            className={`nav-btn ${state.screen === "stats" ? "active" : ""}`}
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "stats" })}
          >
            Stats
          </button>
          <button className="nav-btn" onClick={toggleMute} title="Toggle Sound">
            {muted ? "🔇" : "🔊"}
          </button>
        </div>

        <div className="hud-controls">
          {phase === "playing" && (
            <>
              {/* Weather indicator */}
              <div className="weather-indicator" title={weather.label}>
                <span>{weather.icon}</span>
                {weather.type !== "clear" && <small>{weather.label}</small>}
              </div>

              {/* Speed controls */}
              <div className="speed-controls">
                {SPEED_OPTIONS.map((opt, i) => (
                  <button
                    key={opt.label}
                    className={`speed-btn ${speedIndex === i ? "active" : ""}`}
                    onClick={() => dispatch({ type: "SET_SPEED", speedIndex: i })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                className={`pause-btn ${running ? "" : "paused"}`}
                onClick={() => dispatch({ type: "TOGGLE_PAUSE" })}
              >
                {running ? "⏸ Pause" : "▶ Resume"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="hud-bar">
        <div className="hud-stat">
          <span className="stat-label">Funds</span>
          <span className={`stat-value ${money < 2000 ? "danger" : money < 5000 ? "warning" : "good"}`}>
            ₹{money.toLocaleString()}
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
          <span className="stat-label">Delivered</span>
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
          <span className="stat-label">Expired</span>
          <span className={`stat-value ${stats.totalExpired > 0 ? "warning" : ""}`}>
            {stats.totalExpired}
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
