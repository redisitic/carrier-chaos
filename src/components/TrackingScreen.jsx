import { useGame } from "../context/GameContext";

const TERRAIN_ICONS = {
  Urban: "🏙️",
  Rugged: "🪨",
  Waterway: "🌊",
  Mountain: "⛰️",
};

function ProgressBar({ value }) {
  // value between 0 and 1
  const pct = Math.max(0, Math.min(100, (1 - value) * 100));
  const color = pct > 70 ? "#22c55e" : pct > 35 ? "#f59e0b" : "#ef4444";
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function TrackingScreen() {
  const { state } = useGame();
  const { activeDeliveries, completedDeliveries, failedDeliveries } = state;

  return (
    <div className="screen tracking-screen">
      <div className="panel full-width">
        <div className="panel-header">
          <h2>Live Delivery Tracking</h2>
          <span className="count-badge in-transit">{activeDeliveries.length} in transit</span>
        </div>

        {activeDeliveries.length === 0 ? (
          <div className="empty-state">No active deliveries. Dispatch orders from the Warehouse.</div>
        ) : (
          <div className="tracking-list">
            {activeDeliveries.map((d) => {
              const total = d.deliveryResult?.durationHours || 1;
              const progress = d.remainingHours / total;
              return (
                <div key={d.id} className="tracking-card">
                  <div className="tracking-top">
                    <div className="tracking-id">
                      <span className="order-id">#{d.id}</span>
                      <span className="carrier-badge" style={{ background: getCarrierColor(d.deliveryResult?.carrierName) }}>
                        {getCarrierIcon(d.deliveryResult?.carrierName)} {d.deliveryResult?.carrierName}
                      </span>
                    </div>
                    <div className="tracking-meta">
                      <span>{TERRAIN_ICONS[d.destinationTerrain]} {d.destinationTerrain}</span>
                      <span>{d.distance} km</span>
                      <span className="eta-label">ETA: {d.remainingHours.toFixed(1)}h</span>
                    </div>
                  </div>
                  <ProgressBar value={progress} />
                  {d.deliveryResult?.anomaly && (
                    <div className="anomaly-notice">
                      ⚠ {d.deliveryResult.anomaly.label} — +{d.deliveryResult.anomaly.extraHours}h added
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="tracking-bottom-row">
        <div className="panel half">
          <div className="panel-header">
            <h3>Completed</h3>
            <span className="count-badge">{completedDeliveries.length}</span>
          </div>
          <div className="compact-list">
            {completedDeliveries.slice().reverse().map((d) => (
              <div key={d.id} className="compact-row success">
                <span className="order-id">#{d.id}</span>
                <span>{d.deliveryResult?.carrierName}</span>
                <span>{TERRAIN_ICONS[d.destinationTerrain]}</span>
                <span className="points-tag">+{d.deliveryResult?.points}pts</span>
                {d.deliveryResult?.isFast && <span className="fast-tag">Fast</span>}
              </div>
            ))}
            {completedDeliveries.length === 0 && <div className="empty-state small">None yet.</div>}
          </div>
        </div>

        <div className="panel half">
          <div className="panel-header">
            <h3>Failed</h3>
            <span className={`count-badge ${failedDeliveries.length > 0 ? "danger" : ""}`}>{failedDeliveries.length}</span>
          </div>
          <div className="compact-list">
            {failedDeliveries.map((d) => (
              <div key={d.id} className="compact-row fail">
                <span className="order-id">#{d.id}</span>
                <span>Failed</span>
              </div>
            ))}
            {failedDeliveries.length === 0 && <div className="empty-state small">No failures.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

const CARRIER_COLORS = {
  CityExpress: "#3b82f6",
  EcoShip: "#22c55e",
  MountainGo: "#f97316",
  RiverLine: "#06b6d4",
};
const CARRIER_ICONS = {
  CityExpress: "🚚",
  EcoShip: "🌿",
  MountainGo: "⛰️",
  RiverLine: "🚢",
};

function getCarrierColor(name) { return CARRIER_COLORS[name] || "#64748b"; }
function getCarrierIcon(name) { return CARRIER_ICONS[name] || "📦"; }
