import { useGame } from "../context/GameContext";
import { CARRIERS, ORDER_EXPIRY_MINUTES, SLA_HOURS } from "../game/constants";
import { getServiceOptions, getExpiryProgress, formatDeliveryDate } from "../game/logic";

export default function CarrierSelectionScreen() {
  const { state, dispatch } = useGame();
  const { selectedOrderId, warehouseQueue, money, gameMinutes } = state;

  const gameHour = gameMinutes / 60;
  const order = warehouseQueue.find((o) => o.id === selectedOrderId);

  if (!order) {
    dispatch({ type: "SET_SCREEN", screen: "warehouse" });
    return null;
  }

  const serviceOptions = getServiceOptions(order);
  const cheapestValidCost = Math.min(
    ...serviceOptions.filter((o) => o.valid).map((o) => o.cost),
    Infinity
  );
  const trend = getCostTrend(gameHour);
  const expiryPct = getExpiryProgress(order, gameMinutes);

  const handleSelect = (carrierName, serviceName) => {
    dispatch({ type: "DISPATCH_ORDER", orderId: order.id, carrierName, serviceName });
  };

  const handleBack = () => {
    dispatch({ type: "SET_SCREEN", screen: "warehouse" });
  };

  // Group services by carrier
  const carrierGroups = CARRIERS.map((carrier) => ({
    ...carrier,
    options: serviceOptions.filter((o) => o.carrierName === carrier.name),
  }));

  return (
    <div className="screen carrier-screen">
      <div className="carrier-header">
        <button className="back-btn" onClick={handleBack}>← Back</button>
        <div className="order-summary">
          <h2>{order.storeIcon} Order #{order.id}</h2>
          <div className="order-details">
            <span className="detail-pill">📍 {order.zone}</span>
            <span className="detail-pill">📦 {order.weight} kg</span>
            <span className="detail-pill" title={`SLA: ${order.deadline} `}>
              ⏰ Due {formatDeliveryDate(order.arrivalMinutes + SLA_HOURS[order.deadline] * 60)}
            </span>
            <span className="detail-pill">{order.priority}</span>
            {order.isDG && <span className="detail-pill" style={{ background: "#dc2626", color: "#fff" }}>☢️ DG</span>}
            {order.isFragile && <span className="detail-pill" style={{ background: "#f59e0b", color: "#000" }}>🔸 Fragile</span>}
            <span className="detail-pill">₹{order.value.toLocaleString()}</span>
          </div>
        </div>
        {/* Expiry bar */}
        <div className="expiry-bar" title={`${Math.round((1 - expiryPct) * 100)}% time remaining`}>
          <div
            className="expiry-fill"
            style={{
              width: `${(1 - expiryPct) * 100}% `,
              background: expiryPct > 0.7 ? "var(--danger)" : expiryPct > 0.4 ? "var(--warning)" : "var(--success)",
            }}
          />
        </div>
      </div>

      <div className="terrain-tip">
        <span className="tip-icon">💡</span>
        Choose a carrier + service that meets the <strong>{order.deadline}</strong> deadline. Wrong choices will cost you points!
        {trend === "up" && <span style={{ color: "var(--warning)", marginLeft: 8 }}>⚠️ Rush hour pricing active!</span>}
      </div>

      <div className="carrier-grid">
        {carrierGroups.map((carrier) => (
          <div key={carrier.name} className="carrier-card" style={{ "--carrier-color": carrier.color }}>
            <div className="carrier-card-header">
              <span className="carrier-icon-animated" style={{ fontSize: 24 }}>{carrier.icon}</span>
              <div>
                <div className="carrier-name">{carrier.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  Reliability: {Math.round(carrier.reliability * 100)}%
                </div>
              </div>
            </div>

            <div className="service-list">
              {carrier.options.map((opt) => {
                const canAfford = money >= opt.cost;
                const isCheapest = opt.valid && opt.cost === cheapestValidCost;
                const hasWarnings = !opt.valid && opt.reasons.length > 0;

                return (
                  <div
                    key={`${opt.carrierName} -${opt.serviceName} `}
                    className={`service - row ${!canAfford ? "disabled" : ""} ${isCheapest ? "best-value" : ""} ${hasWarnings ? "has-warnings" : ""} `}
                  >
                    <div className="service-info">
                      <span className="service-name">{opt.serviceName}</span>
                      <span className="service-sla">{opt.sla}</span>
                      {opt.dg && <span className="dg-badge">DG ✓</span>}
                      {isCheapest && <span className="match-badge">Best Value</span>}
                      {hasWarnings && (
                        <div className="service-warnings">
                          {opt.reasons.map((r, i) => (
                            <span key={i} className="warning-tag">⚠ {r}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="service-cost">₹{opt.cost}</div>
                    {canAfford ? (
                      <button
                        className="select-carrier-btn small"
                        style={{ background: hasWarnings ? "#7f1d1d" : carrier.color }}
                        onClick={() => handleSelect(opt.carrierName, opt.serviceName)}
                      >
                        {hasWarnings ? "Dispatch ⚠" : "Dispatch"}
                      </button>
                    ) : (
                      <div className="service-reason">No funds</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
