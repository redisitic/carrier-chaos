import { useGame } from "../context/GameContext";
import { CARRIERS, TERRAIN_PENALTY } from "../game/constants";
import { isCarrierAvailable } from "../game/logic";

const TERRAIN_ICONS = {
  Urban: "🏙️",
  Rugged: "🪨",
  Waterway: "🌊",
  Mountain: "⛰️",
};

export default function CarrierSelectionScreen() {
  const { state, dispatch } = useGame();
  const { selectedOrderId, warehouseQueue, money, gameMinutes } = state;

  const gameHour = gameMinutes / 60;
  const order = warehouseQueue.find((o) => o.id === selectedOrderId);

  if (!order) {
    dispatch({ type: "SET_SCREEN", screen: "warehouse" });
    return null;
  }

  const handleSelect = (carrierName) => {
    dispatch({ type: "DISPATCH_ORDER", orderId: order.id, carrierName });
  };

  const handleBack = () => {
    dispatch({ type: "SET_SCREEN", screen: "warehouse" });
  };

  return (
    <div className="screen carrier-screen">
      <div className="carrier-header">
        <button className="back-btn" onClick={handleBack}>← Back</button>
        <div className="order-summary">
          <h2>Order #{order.id}</h2>
          <div className="order-details">
            <span className="detail-pill">
              {TERRAIN_ICONS[order.destinationTerrain]} {order.destinationTerrain}
            </span>
            <span className="detail-pill">{order.distance} km</span>
            <span className="detail-pill">{order.priority}</span>
          </div>
        </div>
      </div>

      <div className="terrain-tip">
        <span className="tip-icon">💡</span>
        Tip: Matching carrier terrain reduces delivery time penalty significantly.
      </div>

      <div className="carrier-grid">
        {CARRIERS.map((carrier) => {
          const available = isCarrierAvailable(carrier, gameHour);
          const canAfford = money >= carrier.costPerShipment;
          const isMatch = carrier.preferredTerrains.includes(order.destinationTerrain);

          // Preview calculation (no anomaly roll for preview)
          const basePenalty = TERRAIN_PENALTY[order.destinationTerrain];
          const penalty = isMatch ? basePenalty * 0.6 : basePenalty;
          const preview = ((order.distance / carrier.speed) * penalty).toFixed(1);

          const disabled = !available || !canAfford;

          return (
            <div
              key={carrier.name}
              className={`carrier-card ${isMatch ? "terrain-match" : ""} ${disabled ? "disabled" : ""}`}
              style={{ "--carrier-color": carrier.color }}
            >
              <div className="carrier-card-header">
                <span className="carrier-icon">{carrier.icon}</span>
                <div>
                  <div className="carrier-name">{carrier.name}</div>
                  {isMatch && <div className="match-badge">Best Match</div>}
                </div>
                <div className="carrier-cost">${carrier.costPerShipment}</div>
              </div>

              <div className="carrier-attrs">
                <div className="attr">
                  <span className="attr-label">Speed</span>
                  <SpeedBar speed={carrier.speed} />
                </div>
                <div className="attr">
                  <span className="attr-label">Terrain</span>
                  <span className="attr-val">{carrier.preferredTerrains.join(", ")}</span>
                </div>
                <div className="attr">
                  <span className="attr-label">Hours</span>
                  <span className="attr-val">
                    {carrier.operatingHours
                      ? `${carrier.operatingHours.start}:00–${carrier.operatingHours.end}:00`
                      : "24h"}
                  </span>
                </div>
                <div className="attr">
                  <span className="attr-label">Est. Time</span>
                  <span className={`attr-val ${isMatch ? "highlight" : ""}`}>{preview}h</span>
                </div>
              </div>

              {!available && (
                <div className="carrier-unavail">Not available at current time</div>
              )}
              {available && !canAfford && (
                <div className="carrier-unavail">Insufficient funds</div>
              )}

              {!disabled && (
                <button
                  className="select-carrier-btn"
                  style={{ background: carrier.color }}
                  onClick={() => handleSelect(carrier.name)}
                >
                  Dispatch with {carrier.name}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SpeedBar({ speed }) {
  const pct = Math.round((speed / 100) * 100);
  return (
    <div className="speed-bar-track">
      <div className="speed-bar-fill" style={{ width: `${pct}%` }} />
      <span className="speed-val">{speed} km/h</span>
    </div>
  );
}
