import { useGame } from "../context/GameContext";
import { isWarehouseOpen } from "../game/logic";
import { WAREHOUSE } from "../game/constants";
import WarehouseWorkers from "./WarehouseWorkers";

const TERRAIN_ICONS = {
  Urban: "🏙️",
  Rugged: "🪨",
  Waterway: "🌊",
  Mountain: "⛰️",
};

const PRIORITY_BADGE = {
  Express: "badge-express",
  Normal: "badge-normal",
  Economy: "badge-economy",
};

export default function WarehouseScreen() {
  const { state, dispatch } = useGame();
  const { warehouseQueue, activeDeliveries, completedDeliveries, log, gameMinutes } = state;

  const gameHour = gameMinutes / 60;
  const warehouseOpen = isWarehouseOpen(gameHour);

  const handleSelectOrder = (orderId) => {
    dispatch({ type: "SELECT_ORDER", orderId });
  };

  return (
    <div className="screen warehouse-screen">
      <div className="screen-left">
        {/* Warehouse status header */}
        <div className="panel">
          <div className="panel-header">
            <h2>Warehouse</h2>
            <span className={`status-badge ${warehouseOpen ? "open" : "closed"}`}>
              {warehouseOpen ? "OPEN" : "CLOSED"}
            </span>
          </div>
          <div className="warehouse-meta">
            <span>Hours: {WAREHOUSE.openHour}:00 – {WAREHOUSE.closeHour}:00</span>
            <span>Workers: {WAREHOUSE.workers}</span>
            <span>Capacity: {warehouseQueue.length} / {WAREHOUSE.capacity}</span>
          </div>
        </div>

        {/* Animated workers */}
        <WarehouseWorkers
          totalWorkers={WAREHOUSE.workers}
          busyCount={Math.min(warehouseQueue.length, WAREHOUSE.workers)}
        />

        {/* Incoming orders queue */}
        <div className="panel grow">
          <div className="panel-header">
            <h3>Incoming Orders</h3>
            <span className="count-badge">{warehouseQueue.length}</span>
          </div>

          {warehouseQueue.length === 0 ? (
            <div className="empty-state">
              {warehouseOpen ? "Waiting for orders..." : "Warehouse is closed. Orders arrive at 09:00."}
            </div>
          ) : (
            <div className="order-list">
              {warehouseQueue.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-card-top">
                    <span className="order-id">#{order.id}</span>
                    <span className={`badge ${PRIORITY_BADGE[order.priority]}`}>{order.priority}</span>
                    <span className="terrain-tag">
                      {TERRAIN_ICONS[order.destinationTerrain]} {order.destinationTerrain}
                    </span>
                    <span className="distance">{order.distance} km</span>
                  </div>
                  <div className="order-card-bottom">
                    <button
                      className="dispatch-btn"
                      onClick={() => handleSelectOrder(order.id)}
                    >
                      Select Carrier →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="screen-right">
        {/* Active deliveries summary */}
        <div className="panel">
          <div className="panel-header">
            <h3>Active Deliveries</h3>
            <span className="count-badge in-transit">{activeDeliveries.length}</span>
          </div>
          {activeDeliveries.length === 0 ? (
            <div className="empty-state small">No deliveries in transit.</div>
          ) : (
            <div className="active-list">
              {activeDeliveries.map((d) => (
                <div key={d.id} className="active-row">
                  <span className="order-id">#{d.id}</span>
                  <span>{d.deliveryResult?.carrierName}</span>
                  <span className="terrain-tag small">{TERRAIN_ICONS[d.destinationTerrain]} {d.destinationTerrain}</span>
                  <span className="eta">ETA {d.remainingHours.toFixed(1)}h</span>
                  {d.deliveryResult?.anomaly && (
                    <span className="anomaly-tag">⚠ {d.deliveryResult.anomaly.label}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Event log */}
        <div className="panel grow">
          <div className="panel-header">
            <h3>Event Log</h3>
          </div>
          <div className="log-list">
            {log.length === 0 && <div className="empty-state small">No events yet.</div>}
            {log.map((entry) => (
              <div key={entry.id} className={`log-entry log-${entry.type}`}>
                <span className="log-dot" />
                <span>{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
