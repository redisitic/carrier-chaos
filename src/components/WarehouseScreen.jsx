import { useGame } from "../context/GameContext";
import { isWarehouseOpen, getExpiryProgress, formatDeliveryDate } from "../game/logic";
import { WAREHOUSE, ORDER_EXPIRY_MINUTES, SLA_HOURS } from "../game/constants";
import WarehouseWorkers from "./WarehouseWorkers";

const PRIORITY_BADGE = {
  Express: "badge-express",
  Standard: "badge-normal",
  Economy: "badge-economy",
};

export default function WarehouseScreen() {
  const { state, dispatch } = useGame();
  const { warehouseQueue, activeDeliveries, log, gameMinutes } = state;

  const gameHour = gameMinutes / 60;
  const warehouseOpen = isWarehouseOpen(gameHour);

  const handleSelectOrder = (orderId) => {
    dispatch({ type: "SELECT_ORDER", orderId });
  };

  return (
    <div className="screen warehouse-screen">
      <div className="screen-left">
        {/* Dashboard status header */}
        <div className="panel">
          <div className="panel-header">
            <h2>📋 Centiro Dashboard</h2>
            <span className={`status-badge ${warehouseOpen ? "open" : "closed"}`}>
              {warehouseOpen ? "OPEN" : "CLOSED"}
            </span>
          </div>
          <div className="warehouse-meta">
            <span>Hours: {WAREHOUSE.openHour}:00 – {WAREHOUSE.closeHour}:00</span>
            <span>Capacity: {warehouseQueue.length} / {WAREHOUSE.capacity}</span>
          </div>
        </div>

        {/* Animated workers */}
        <WarehouseWorkers
          totalWorkers={5}
          busyCount={Math.min(warehouseQueue.length, 5)}
        />

        {/* Incoming orders queue */}
        <div className="panel grow">
          <div className="panel-header">
            <h3>Incoming Orders</h3>
            <span className="count-badge">{warehouseQueue.length}</span>
          </div>

          {warehouseQueue.length === 0 ? (
            <div className="empty-state">
              {warehouseOpen ? "Waiting for orders..." : "Dashboard closed. Orders arrive at 08:00."}
            </div>
          ) : (
            <div className="order-list">
              {warehouseQueue.map((order) => {
                const expiryPct = getExpiryProgress(order, gameMinutes);
                return (
                  <div key={order.id} className="order-card">
                    <div className="order-card-top">
                      <span className="order-id">{order.storeIcon} #{order.id}</span>
                      <span className={`badge ${PRIORITY_BADGE[order.priority]}`}>{order.priority}</span>
                      <span className="terrain-tag">📍 {order.zone}</span>
                      <span className="distance">{order.weight}kg · {order.distance}km</span>
                      {order.isDG && <span className="dg-tag">☢️ DG</span>}
                      {order.isFragile && <span className="fragile-tag">🔸</span>}
                    </div>
                    <div className="order-card-mid">
                      <span className="deadline-tag" title={`SLA: ${order.deadline}`}>
                        ⏰ Due {formatDeliveryDate(order.arrivalMinutes + SLA_HOURS[order.deadline] * 60)}
                      </span>
                      <span className="value-tag">₹{order.value.toLocaleString()}</span>
                      {/* Expiry indicator */}
                      <div className="expiry-mini" title={`Expires in ${Math.round(ORDER_EXPIRY_MINUTES * (1 - expiryPct))} min`}>
                        <div
                          className="expiry-fill-mini"
                          style={{
                            width: `${(1 - expiryPct) * 100}%`,
                            background: expiryPct > 0.7 ? "var(--danger)" : expiryPct > 0.4 ? "var(--warning)" : "var(--success)",
                          }}
                        />
                      </div>
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
                );
              })}
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
              {activeDeliveries.map((d) => {
                const elapsed = (gameMinutes - d.dispatchMinutes) / 60;
                const progress = Math.min(1, elapsed / d.deliveryResult.durationHours);
                return (
                  <div key={d.id} className="active-row">
                    <span className="order-id">{d.storeIcon} #{d.id}</span>
                    <span>{d.deliveryResult?.carrierName} — {d.deliveryResult?.serviceName}</span>
                    <span className="terrain-tag small">📍 {d.zone}</span>
                    <div className="progress-bar-mini">
                      <div className="progress-fill-mini" style={{ width: `${progress * 100}%` }} />
                    </div>
                  </div>
                );
              })}
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
            {log.map((entry, i) => (
              <div key={i} className={`log-entry log-${entry.type}`}>
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
