import { useGame } from "../context/GameContext";
import { xpLevel } from "../game/logic";
import { useAudio } from "../hooks/useAudio";
import DebugPanel from "./DebugPanel";
import { useEffect, useRef, useState } from "react";
import { RUSH_HOURS, RUSH_MULTIPLIER } from "../game/constants";

function formatTime(gameMinutes) {
  const total = Math.floor(gameMinutes);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// TF2-style floating score delta numbers
let _floatId = 0;
function PointsDisplay({ points }) {
  const prevRef = useRef(points);
  const [floats, setFloats] = useState([]);

  useEffect(() => {
    const delta = points - prevRef.current;
    if (delta !== 0) {
      const id = ++_floatId;
      setFloats((f) => [...f, { id, delta }]);
      // remove after animation (~1.4s)
      setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1400);
    }
    prevRef.current = points;
  }, [points]);

  return (
    <div className="points-display-wrap">
      {floats.map(({ id, delta }) => (
        <span
          key={id}
          className={`score-float ${delta > 0 ? "score-pos" : "score-neg"}`}
        >
          {delta > 0 ? `+${delta}` : delta}
        </span>
      ))}
      <span className="stat-value points">{points}</span>
      <style>{`
        .points-display-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .score-float {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.85rem;
          font-weight: 800;
          line-height: 1;
          white-space: nowrap;
          pointer-events: none;
          animation: score-rise 1.4s ease-out forwards;
        }
        .score-pos { color: #22c55e; text-shadow: 0 0 8px #22c55e99; }
        .score-neg { color: #ef4444; text-shadow: 0 0 8px #ef444499; }
        @keyframes score-rise {
          0%   { opacity: 1; transform: translateX(-50%) translateY(0px) scale(1.2); }
          20%  { opacity: 1; transform: translateX(-50%) translateY(-6px) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-28px) scale(0.85); }
        }
      `}</style>
    </div>
  );
}

// ── Info Ticker / Carousel ────────────────────────────────────────────────
function HudTicker({ weather, day, dailyPoints, stats, warehouseQueue, activeDeliveries, gameMinutes }) {
  const gameHour = (gameMinutes / 60) % 24;
  const isRushHour = RUSH_HOURS.some((rh) => gameHour >= rh.start && gameHour < rh.end);
  const nextRush = RUSH_HOURS.find((rh) => gameHour < rh.start);

  const slides = [
    {
      icon: weather.icon,
      label: weather.label,
      sub:
        weather.type !== "clear"
          ? `${weather.deliveryMultiplier}× delay${weather.terrainEffect ? ` · ${weather.terrainEffect}` : " · all zones"}`
          : "All delivery routes clear",
      color: weather.type === "clear" ? "#22c55e" : "#f59e0b",
    },
    {
      icon: isRushHour ? "🔥" : "🕐",
      label: isRushHour ? "Rush Hour Active" : "Off-Peak Hours",
      sub: isRushHour
        ? `+${Math.round((RUSH_MULTIPLIER - 1) * 100)}% surcharge · avoid expensive dispatches`
        : nextRush
        ? `Next rush: ${nextRush.start}:00–${nextRush.end}:00`
        : "No more rush hours today",
      color: isRushHour ? "#ef4444" : "#64748b",
    },
    {
      icon: "📈",
      label: `Shift ${day} · ${dailyPoints >= 0 ? "+" : ""}${dailyPoints} pts`,
      sub: `${stats.totalDelivered} delivered · ${stats.totalFailed} failed · Earn ₹${Math.max(0, dailyPoints * 10).toLocaleString()} at EOD`,
      color: dailyPoints >= 0 ? "#22c55e" : "#ef4444",
    },
    {
      icon: "📦",
      label: `${warehouseQueue.length} pending · ${activeDeliveries.length} in transit`,
      sub: warehouseQueue.length > 12 ? "⚠️ Warehouse near capacity — dispatch orders!" : "Warehouse operations nominal",
      color: warehouseQueue.length > 12 ? "#f59e0b" : "#38bdf8",
    },
  ];

  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx((i) => (i + 1) % slides.length);
        setFading(false);
      }, 280);
    }, 3500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[idx];

  return (
    <div className="hud-ticker">
      <div
        className={`hud-ticker-inner ${fading ? "fade-out" : "fade-in"}`}
        style={{ "--tick-color": slide.color }}
      >
        <span className="tick-icon">{slide.icon}</span>
        <div className="tick-text">
          <span className="tick-label">{slide.label}</span>
          <span className="tick-sub">{slide.sub}</span>
        </div>
        <div className="tick-dots">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`tick-dot${i === idx ? " active" : ""}`}
              onClick={() => setIdx(i)}
            />
          ))}
        </div>
      </div>
      <style>{`
        .hud-ticker {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0 8px;
          min-width: 0;
        }
        .hud-ticker-inner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          padding: 5px 14px 5px 10px;
          width: 100%;
          max-width: 400px;
          transition: opacity 0.28s ease;
        }
        .hud-ticker-inner.fade-out { opacity: 0; }
        .hud-ticker-inner.fade-in  { opacity: 1; }
        .tick-icon { font-size: 1.15rem; flex-shrink: 0; }
        .tick-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }
        .tick-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--tick-color, #f8fafc);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tick-sub {
          font-size: 0.67rem;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tick-dots {
          display: flex;
          gap: 4px;
          align-items: center;
          flex-shrink: 0;
        }
        .tick-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #334155;
          cursor: pointer;
          transition: background 0.3s, transform 0.2s;
        }
        .tick-dot.active {
          background: var(--tick-color, var(--accent));
          transform: scale(1.3);
        }
        .tick-dot:hover { background: #64748b; }
      `}</style>
    </div>
  );
}

export default function HUD() {
  const { state, dispatch } = useGame();
  const { money, xp, points, dailyPoints, stats, warehouseQueue, activeDeliveries, gameMinutes, day, running, phase, weather, speedIndex } = state;
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
          <span className="clock-day">Shift {day}</span>
          <span className="clock-time">{formatTime(gameMinutes)}</span>
        </div>

        {phase === "playing" && (
          <HudTicker
            weather={weather}
            day={day}
            dailyPoints={dailyPoints || 0}
            stats={stats}
            warehouseQueue={warehouseQueue}
            activeDeliveries={activeDeliveries}
            gameMinutes={gameMinutes}
          />
        )}

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
            3D Map
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
              {/* Debug Panel toggle + panel */}
              <DebugPanel />

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
          <PointsDisplay points={points} />
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
      </div>
    </div>
  );
}
