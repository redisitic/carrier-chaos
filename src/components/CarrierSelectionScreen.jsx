import { useState } from "react";
import { useGame } from "../context/GameContext";
import { CARRIERS, ORDER_EXPIRY_MINUTES, SLA_HOURS } from "../game/constants";
import { getServiceOptions, getExpiryProgress, formatDeliveryDate, getCostTrend } from "../game/logic";

// ── Dark Souls item description tooltip ───────────────────────────────────────
function DarkSoulsTooltip({ carrier, visible }) {
  if (!visible) return null;
  const reliabilityBar = Math.round(carrier.reliability * 10);
  return (
    <div className="ds-tooltip">
      <div className="ds-tooltip-name" style={{ color: carrier.color === "#FFCC00" ? "#f59e0b" : carrier.color }}>
        {carrier.icon} {carrier.name}
      </div>
      <div className="ds-tooltip-divider" />
      <p className="ds-tooltip-lore">{carrier.lore}</p>
      <div className="ds-tooltip-divider" />
      <div className="ds-tooltip-stat-row">
        <span className="ds-stat-label">Reliability</span>
        <span className="ds-stat-bar">
          {"█".repeat(reliabilityBar)}{"░".repeat(10 - reliabilityBar)}
        </span>
        <span className="ds-stat-val">{Math.round(carrier.reliability * 100)}%</span>
      </div>
      <div className="ds-tooltip-divider" />
      <div className="ds-pros-cons">
        <div>
          {carrier.pros?.map((p) => (
            <div key={p} className="ds-pro">✦ {p}</div>
          ))}
        </div>
        <div>
          {carrier.cons?.map((c) => (
            <div key={c} className="ds-con">✧ {c}</div>
          ))}
        </div>
      </div>
    </div>
  );
}


export default function CarrierSelectionScreen() {
  const { state, dispatch } = useGame();
  const { selectedOrderId, warehouseQueue, money, gameMinutes } = state;
  const [hoveredCarrier, setHoveredCarrier] = useState(null);

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

  const carrierGroups = CARRIERS.map((carrier) => ({
    ...carrier,
    options: serviceOptions.filter((o) => o.carrierName === carrier.name),
  }));

  return (
    <div className="screen carrier-screen">
      {/* ── Order Header ── */}
      <div className="carrier-header">
        <button className="back-btn" onClick={handleBack}>← Back</button>

        <div className="order-summary-rich">
          {/* Product + route */}
          <div className="order-product-line">
            <span className="order-product-icon">{order.storeIcon}</span>
            <div>
              <div className="order-product-name">{order.productName || "Package"}</div>
              <div className="order-route">
                <span className="route-origin">📍 Nagpur Hub</span>
                <span className="route-arrow"> ──▶ </span>
                <span className="route-dest" title={order.zone}>{order.city || order.zone}</span>
                <span className="route-dist">({order.distance} km)</span>
              </div>
            </div>
            <div className="order-id-badge">#{order.id}</div>
          </div>

          {/* Pills */}
          <div className="order-details">
            <span className="detail-pill">{order.store}</span>
            <span className="detail-pill">📦 {order.weight} kg</span>
            <span className="detail-pill">₹{order.value.toLocaleString()}</span>
            <span className="detail-pill" title={`SLA: ${order.deadline}`}>
              ⏰ Due {formatDeliveryDate(order.arrivalMinutes + SLA_HOURS[order.deadline] * 60)}
            </span>
            <span className={`detail-pill priority-${order.priority.toLowerCase()}`}>{order.priority}</span>
          </div>

          <div className="order-lore">
            <div className="order-lore-icon">📋</div>
            <div className="order-lore-text">
              {order.desc || `Standard shipment of ${order.productName || "Package"}.`}
            </div>
          </div>
        </div>

        {/* Expiry */}
        <div className="expiry-bar" title={`${Math.round((1 - expiryPct) * 100)}% time remaining`}>
          <div
            className="expiry-fill"
            style={{
              width: `${(1 - expiryPct) * 100}%`,
              background: expiryPct > 0.7 ? "var(--danger)" : expiryPct > 0.4 ? "var(--warning)" : "var(--success)",
            }}
          />
        </div>
      </div>

      <div className="terrain-tip">
        <span className="tip-icon">💡</span>
        Review the shipment manifest above to determine the required service type.
        {trend === "up" && <span style={{ color: "var(--warning)", marginLeft: 8 }}>⚠️ Rush hour pricing active!</span>}
      </div>

      {/* ── Carrier Grid ── */}
      <div className="carrier-grid">
        {carrierGroups.map((carrier) => (
          <div key={carrier.name} className="carrier-card" style={{ "--carrier-color": carrier.color }}>
            {/* Carrier header with Dark Souls tooltip trigger */}
            <div className="carrier-card-header"
              onMouseEnter={() => setHoveredCarrier(carrier.name)}
              onMouseLeave={() => setHoveredCarrier(null)}
            >
              <span className="carrier-icon-animated" style={{ fontSize: 24 }}>{carrier.icon}</span>
              <div style={{ position: "relative" }}>
                <div className="carrier-name ds-hoverable">{carrier.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  Reliability: {Math.round(carrier.reliability * 100)}%
                </div>
                <DarkSoulsTooltip carrier={carrier} visible={hoveredCarrier === carrier.name} />
              </div>
            </div>

            {/* Services */}
            <div className="service-list">
              {carrier.options.map((opt) => {
                const canAfford = money >= opt.cost;
                const svcData = carrier.services?.find((s) => s.name === opt.serviceName);

                return (
                  <div
                    key={`${opt.carrierName}-${opt.serviceName}`}
                    className={`service-card-v ${!canAfford ? "disabled" : ""}`}
                  >
                    <div className="svc-header-row">
                      <div className="svc-name-group">
                        <span className="service-name">{opt.serviceName}</span>
                        <span className="service-sla">{opt.sla}</span>
                      </div>
                      
                      {canAfford ? (
                        <button
                          className="plain-dispatch-btn"
                          onClick={() => handleSelect(opt.carrierName, opt.serviceName)}
                        >
                          ₹{opt.cost.toLocaleString()} &nbsp;Dispatch
                        </button>
                      ) : (
                        <div className="service-reason-static">₹{opt.cost.toLocaleString()} (No Funds)</div>
                      )}
                    </div>

                    {svcData?.desc && (
                      <div className="service-desc-brief">
                        {svcData.desc.split(".")[0]}.
                      </div>
                    )}
                    
                    <div className="svc-raw-stats">
                      <span title="Delivery timeline expectations">
                        ⏱️ {opt.slaHours}h SLA
                      </span>
                      <span title="Maximum allowed weight for this service">
                        ⚖️ Max {opt.maxWeight}kg
                      </span>
                      <span title="Does this service permit Dangerous Goods?">
                        {opt.dg ? "☢️ DG Permitted" : "📦 Std Cargo Only"}
                      </span>
                      <span title="Base rate calculation">
                        💵 ₹{svcData?.costPerKg}/kg
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        /* ── Order header ── */
        .order-summary-rich { flex: 1; }
        .order-product-line {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .order-product-icon { font-size: 2rem; }
        .order-product-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: #f8fafc;
          letter-spacing: 0.01em;
        }
        .order-route {
          font-size: 0.8rem;
          color: #94a3b8;
          margin-top: 2px;
        }
        .route-origin { color: #f59e0b; font-weight: 600; }
        .route-arrow  { color: #475569; }
        .route-dest   { color: #38bdf8; font-weight: 600; }
        .route-dist   { color: #475569; margin-left: 4px; }
        .order-id-badge {
          margin-left: auto;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 0.25rem 0.6rem;
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 700;
        }
        .priority-express { background: #7c3aed22; color: #a78bfa; border-color: #7c3aed55; }
        .priority-standard { background: #0369a122; color: #38bdf8; border-color: #0369a155; }
        .priority-economy { background: #15803d22; color: #4ade80; border-color: #15803d55; }
        
        .order-lore {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: #1e293b44;
          border-left: 2px solid #64748b;
          border-radius: 4px;
        }
        .order-lore-icon {
          font-size: 1.1rem;
          margin-top: -2px;
        }
        .order-lore-text {
          font-size: 0.8rem;
          color: #94a3b8;
          line-height: 1.5;
          font-style: italic;
        }

        /* ── Dark Souls tooltip ── */
        .ds-hoverable { cursor: help; }
        .ds-tooltip {
          position: absolute;
          left: 0;
          top: calc(100% + 8px);
          z-index: 9999;
          width: 300px;
          background: #0a0a0f;
          border: 1px solid #6b7280;
          border-top: 2px solid #d4af37;
          border-bottom: 2px solid #d4af37;
          padding: 1rem;
          font-size: 0.78rem;
          color: #c9b46e;
          box-shadow: 0 8px 32px rgba(0,0,0,0.9), inset 0 0 60px rgba(0,0,0,0.5);
          pointer-events: none;
          line-height: 1.6;
        }
        .ds-tooltip-name {
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-shadow: 0 0 12px currentColor;
          margin-bottom: 0.5rem;
        }
        .ds-tooltip-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #6b728066, #d4af3744, #6b728066, transparent);
          margin: 0.5rem 0;
        }
        .ds-tooltip-lore {
          font-style: italic;
          color: #9d8c5a;
          margin: 0;
          font-size: 0.75rem;
        }
        .ds-tooltip-stat-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.72rem;
        }
        .ds-stat-label { color: #94a3b8; width: 70px; flex-shrink: 0; }
        .ds-stat-bar { color: #d4af37; letter-spacing: -1px; font-size: 0.65rem; flex: 1; }
        .ds-stat-val { color: #f8fafc; font-weight: 700; }
        .ds-pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
        .ds-pro { color: #4ade80; font-size: 0.72rem; margin-bottom: 2px; }
        .ds-con { color: #f87171; font-size: 0.72rem; margin-bottom: 2px; }

        /* ── Vertical Service Card Layout ── */
        .service-card-v {
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 8px;
          padding: 0.75rem;
          margin-bottom: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .svc-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .svc-name-group {
          display: flex;
          flex-direction: column;
        }
        .service-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #f0f6fc;
        }
        .service-sla {
          font-size: 0.75rem;
          color: #8b949e;
        }
        .plain-dispatch-btn {
          background: #21262d;
          border: 1px solid #30363d;
          color: #c9d1d9;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .plain-dispatch-btn:hover {
          background: #30363d;
          border-color: #8b949e;
          color: #f0f6fc;
        }
        .service-reason-static {
          font-size: 0.8rem;
          color: #f85149;
          font-weight: 600;
        }
        .service-desc-brief {
          font-size: 0.75rem;
          color: #8b949e;
          font-style: italic;
          line-height: 1.4;
          border-top: 1px solid #21262d;
          padding-top: 0.4rem;
        }
        .svc-raw-stats {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.3rem;
          font-size: 0.7rem;
          color: #6e7681;
          background: #161b22;
          padding: 0.4rem 0.5rem;
          border-radius: 4px;
        }
        .svc-raw-stats span {
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
        }
      `}</style>
    </div>
  );
}
