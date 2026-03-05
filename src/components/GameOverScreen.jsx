import { useGame } from "../context/GameContext";
import { xpLevel } from "../game/logic";

export default function GameOverScreen() {
  const { state, dispatch } = useGame();
  const { phase, points, xp, money, stats } = state;
  const { level, title } = xpLevel(xp);

  const won = phase === "won";

  return (
    <div className="screen gameover-screen">
      <div className="gameover-card">
        <div className="gameover-icon">{won ? "🏆" : "💥"}</div>
        <h1 className={`gameover-title ${won ? "won" : "lost"}`}>
          {won ? "Mission Complete!" : "Mission Failed"}
        </h1>
        <p className="gameover-subtitle">
          {won
            ? "All shipments delivered. Outstanding logistics management!"
            : stats.totalFailed > 5
            ? "Too many shipments failed. The supply chain collapsed."
            : "You ran out of funds. The operation shut down."}
        </p>

        <div className="gameover-stats">
          <div className="go-stat">
            <span className="go-stat-val">{points}</span>
            <span className="go-stat-label">Final Score</span>
          </div>
          <div className="go-stat">
            <span className="go-stat-val">${money}</span>
            <span className="go-stat-label">Funds Remaining</span>
          </div>
          <div className="go-stat">
            <span className="go-stat-val">{xp}</span>
            <span className="go-stat-label">XP Earned</span>
          </div>
          <div className="go-stat">
            <span className="go-stat-val">Lv.{level}</span>
            <span className="go-stat-label">{title}</span>
          </div>
          <div className="go-stat">
            <span className="go-stat-val">{stats.totalDelivered}</span>
            <span className="go-stat-label">Delivered</span>
          </div>
          <div className="go-stat">
            <span className="go-stat-val">{stats.totalAnomalies}</span>
            <span className="go-stat-label">Anomalies</span>
          </div>
        </div>

        <div className="gameover-actions">
          <button
            className="btn-primary"
            onClick={() => dispatch({ type: "START_GAME" })}
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
