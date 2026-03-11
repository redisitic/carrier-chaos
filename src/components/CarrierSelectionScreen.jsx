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
  const { selectedOrderId, warehouseQueue, money, points, gameMinutes } = state;
  const [hoveredCarrier, setHoveredCarrier] = useState(null);
  const [hoveredFlag, setHoveredFlag] = useState(null);
  const [activeFilters, setActiveFilters] = useState(new Set());

  const toggleFilter = (key) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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

  const handleBack = () => {
    dispatch({ type: "SET_SCREEN", screen: "warehouse" });
  };

  const carrierGroups = CARRIERS.map((carrier) => ({
    ...carrier,
    options: serviceOptions.filter((o) => o.carrierName === carrier.name),
  }));

  // Returns true when a service card should be dimmed.
  // Checks BOTH the hover-preview flag AND any pinned (clicked) filters.
  function isServiceDimmed(opt, svcData) {
    const flagsToDim = new Set(activeFilters);
    if (hoveredFlag) flagsToDim.add(hoveredFlag);
    if (flagsToDim.size === 0) return false;

    for (const flag of flagsToDim) {
      switch (flag) {
        case "dg":      if (!opt.dg) return true; break;
        case "no-dg":   if (opt.dg) return true; break;
        case "fragile": if (opt.slaHours > 1.5) return true; break;
        case "durable": break;
        case "zone":    if (svcData && !svcData.zones.includes(order.zone)) return true; break;
        case "heavy":   if (opt.maxWeight < order.weight) return true; break;
        case "express": if (opt.slaHours > SLA_HOURS[order.deadline]) return true; break;
        default: break;
      }
    }
    return false;
  }

  const FLAG_HINTS = {
    "dg":      "Dimming services that cannot handle Dangerous Goods — selecting them risks a −50 pt penalty.",
    "no-dg":   "Dimming DG-certified services — they’re unnecessary here and cost more than standard options.",
    "fragile": "Dimming slow surface/ground services (>72h SLA) — fragile goods need faster transit.",
    "durable": null,
    "zone":    `Dimming services that don’t cover ${order.zone} — zone mismatches add transit delays.`,
    "heavy":   `Dimming services with max weight below ${order.weight} kg — this shipment exceeds their capacity.`,
    "express": `Dimming services too slow for the ${order.deadline} deadline — SLA would be missed.`,
  };

  const FILTER_BONUS_PER = 2;
  const filterBonus = activeFilters.size * FILTER_BONUS_PER;

  // ── Best option for Carrier Determination ──────────────────────────────
  // Heuristic: valid + affordable, sorted by (cost ascending) so we pick most
  // cost-efficient option which maximises the cost-efficiency scoring bonus.
  const DETERMINATION_COST = 50; // pts deducted for using the auto-pick
  const affordableValid = serviceOptions.filter((o) => o.valid && money >= o.cost);
  const bestOption = affordableValid.length > 0
    ? affordableValid.reduce((best, o) => o.cost < best.cost ? o : best, affordableValid[0])
    : null;

  const handleSelect = (carrierName, serviceName, extraPointsDelta = 0) => {
    const totalBonus = filterBonus + extraPointsDelta;
    dispatch({ type: "DISPATCH_ORDER", orderId: order.id, carrierName, serviceName, filterBonus: totalBonus });
  };

  const handleDetermination = () => {
    if (!bestOption || state.points < DETERMINATION_COST) return;
    dispatch({ type: "SET_TOAST", toast: `🔥 Auto-selected: ${bestOption.carrierName} · ${bestOption.serviceName} (₹${bestOption.cost})` });
    handleSelect(bestOption.carrierName, bestOption.serviceName, -DETERMINATION_COST);
  };

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

          {/* ── Shipment flags: DG, Fragile, Zone, Weight class ── */}
          <div className="order-flags-row">
            {order.isDG ? (
              <span
                className={`order-flag-badge flag-dg${activeFilters.has("dg") || hoveredFlag === "dg" ? " flag-active" : ""}${activeFilters.has("dg") ? " flag-pinned" : ""}`}
                title="Click to pin filter — dims services that cannot handle Dangerous Goods"
                onMouseEnter={() => setHoveredFlag("dg")}
                onMouseLeave={() => setHoveredFlag(null)}
                onClick={() => toggleFilter("dg")}
              >
                {activeFilters.has("dg") ? "📌" : ""}✅ DG Cargo
              </span>
            ) : (
              <span
                className={`order-flag-badge flag-no-dg${activeFilters.has("no-dg") || hoveredFlag === "no-dg" ? " flag-active" : ""}${activeFilters.has("no-dg") ? " flag-pinned" : ""}`}
                title="Click to pin filter — dims expensive DG-certified services you don’t need"
                onMouseEnter={() => setHoveredFlag("no-dg")}
                onMouseLeave={() => setHoveredFlag(null)}
                onClick={() => toggleFilter("no-dg")}
              >
                {activeFilters.has("no-dg") ? "📌" : ""}❌ No DG
              </span>
            )}

            {order.isFragile ? (
              <span
                className={`order-flag-badge flag-fragile${activeFilters.has("fragile") || hoveredFlag === "fragile" ? " flag-active" : ""}${activeFilters.has("fragile") ? " flag-pinned" : ""}`}
                title="Click to pin filter — dims slow services unsafe for fragile goods"
                onMouseEnter={() => setHoveredFlag("fragile")}
                onMouseLeave={() => setHoveredFlag(null)}
                onClick={() => toggleFilter("fragile")}
              >
                {activeFilters.has("fragile") ? "📌" : ""}⚠️ Fragile
              </span>
            ) : (
              <span
                className={`order-flag-badge flag-durable${activeFilters.has("durable") || hoveredFlag === "durable" ? " flag-active" : ""}${activeFilters.has("durable") ? " flag-pinned" : ""}`}
                title="Durable goods — all services are safe to use"
                onMouseEnter={() => setHoveredFlag("durable")}
                onMouseLeave={() => setHoveredFlag(null)}
                onClick={() => toggleFilter("durable")}
              >
                {activeFilters.has("durable") ? "📌" : ""}✅ Durable
              </span>
            )}

            <span
              className={`order-flag-badge flag-zone${activeFilters.has("zone") || hoveredFlag === "zone" ? " flag-active" : ""}${activeFilters.has("zone") ? " flag-pinned" : ""}`}
              title="Click to pin filter — highlights zone-compatible services"
              onMouseEnter={() => setHoveredFlag("zone")}
              onMouseLeave={() => setHoveredFlag(null)}
              onClick={() => toggleFilter("zone")}
            >
              {activeFilters.has("zone") ? "📌" : ""}🌏 {order.zone}
            </span>

            {order.weight > 20 && (
              <span
                className={`order-flag-badge flag-heavy${activeFilters.has("heavy") || hoveredFlag === "heavy" ? " flag-active" : ""}${activeFilters.has("heavy") ? " flag-pinned" : ""}`}
                title="Click to pin filter — highlights services with sufficient weight capacity"
                onMouseEnter={() => setHoveredFlag("heavy")}
                onMouseLeave={() => setHoveredFlag(null)}
                onClick={() => toggleFilter("heavy")}
              >
                {activeFilters.has("heavy") ? "📌" : ""}⚖️ Heavy ({order.weight} kg)
              </span>
            )}

            {order.priority === "Express" && (
              <span
                className={`order-flag-badge flag-express${activeFilters.has("express") || hoveredFlag === "express" ? " flag-active" : ""}${activeFilters.has("express") ? " flag-pinned" : ""}`}
                title="Click to pin filter — highlights services fast enough for the express deadline"
                onMouseEnter={() => setHoveredFlag("express")}
                onMouseLeave={() => setHoveredFlag(null)}
                onClick={() => toggleFilter("express")}
              >
                {activeFilters.has("express") ? "📌" : ""}⚡ Express Priority
              </span>
            )}
          </div>

          {/* DG warning banner */}
          {order.isDG && (
            <div className="dg-warning-banner">
              <span>☢️</span>
              <span>This shipment contains <strong>Dangerous Goods</strong>. You must select a carrier service that shows <strong>DG Permitted</strong> — using a Std Cargo Only service will incur a <strong>−50 pt penalty</strong> and risk delivery failure.</span>
            </div>
          )}

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

      {(hoveredFlag || activeFilters.size > 0) && (
        <div className="flag-hint-bar">
          <span className="tip-icon">🔍</span>
          <span style={{ flex: 1 }}>
            {hoveredFlag && FLAG_HINTS[hoveredFlag]
              ? FLAG_HINTS[hoveredFlag]
              : activeFilters.size > 0
              ? Array.from(activeFilters).filter(f => FLAG_HINTS[f]).map(f => FLAG_HINTS[f]).join(" · ")
              : null
            }
          </span>
          {activeFilters.size > 0 && (
            <span className="filter-bonus-pill">
              📌 {activeFilters.size} filter{activeFilters.size > 1 ? "s" : ""} active
              &nbsp;·&nbsp;
              <span style={{ color: "#22c55e" }}>+{filterBonus} pts bonus on dispatch</span>
            </span>
          )}
        </div>
      )}

      <div className="terrain-tip" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <span>
          <span className="tip-icon">💡</span>
          Hover any badge to preview — click to <strong>pin</strong> a filter. Multi-select supported. Each pinned filter earns +2 pts when dispatching.
          {trend === "up" && <span style={{ color: "var(--warning)", marginLeft: 8 }}>⚠️ Rush hour pricing active!</span>}
        </span>
        <button
          className={`determination-btn${!bestOption || state.points < DETERMINATION_COST ? " determination-disabled" : ""}`}
          onClick={handleDetermination}
          disabled={!bestOption || state.points < DETERMINATION_COST}
          title={!bestOption ? "No valid affordable option available" : state.points < DETERMINATION_COST ? `Need ${DETERMINATION_COST} pts to use` : `AI auto-picks the best carrier — costs ${DETERMINATION_COST} pts`}
        >
          🔥 Carrier Determination
          <span className="determination-cost">−{DETERMINATION_COST} pts</span>
        </button>
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
                const dimmed = isServiceDimmed(opt, svcData);

                return (
                  <div
                    key={`${opt.carrierName}-${opt.serviceName}`}
                    className={`service-card-v ${!canAfford ? "disabled" : ""} ${dimmed ? "flag-dimmed" : ""}`}
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

        /* ── Shipment flag badges ── */
        .order-flags-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 0.5rem;
        }
        .order-flag-badge {
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 0.72rem;
          font-weight: 700;
          border: 1px solid;
          letter-spacing: 0.02em;
          cursor: default;
        }
        .flag-dg      { background: rgba(245,158,11,0.12); border-color: rgba(245,158,11,0.4); color: #f59e0b; }
        .flag-no-dg   { background: rgba(34,197,94,0.08);  border-color: rgba(34,197,94,0.3);  color: #22c55e; }
        .flag-fragile { background: rgba(239,68,68,0.1);   border-color: rgba(239,68,68,0.4);  color: #f87171; }
        .flag-durable { background: rgba(14,165,233,0.08); border-color: rgba(14,165,233,0.3); color: #38bdf8; }
        .flag-zone    { background: rgba(99,102,241,0.1);  border-color: rgba(99,102,241,0.35);color: #818cf8; }
        .flag-heavy   { background: rgba(168,85,247,0.1);  border-color: rgba(168,85,247,0.35);color: #c084fc; }
        .flag-express { background: rgba(251,191,36,0.1);  border-color: rgba(251,191,36,0.35);color: #fbbf24; }

        /* ── Carrier Determination button ── */
        .determination-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(234,179,8,0.12));
          border: 1px solid rgba(239,68,68,0.45);
          color: #fca5a5;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .determination-btn:hover:not(.determination-disabled) {
          background: linear-gradient(135deg, rgba(239,68,68,0.28), rgba(234,179,8,0.2));
          border-color: rgba(239,68,68,0.7);
          color: #fee2e2;
          box-shadow: 0 0 12px rgba(239,68,68,0.3);
        }
        .determination-btn.determination-disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .determination-cost {
          font-size: 0.7rem;
          color: #ef4444;
          font-weight: 800;
          background: rgba(239,68,68,0.12);
          padding: 1px 6px;
          border-radius: 4px;
        }

        /* active (being hovered OR pinned) flag badge glows */
        .order-flag-badge { cursor: pointer; transition: filter 0.15s, box-shadow 0.15s, opacity 0.15s; }
        .order-flag-badge.flag-active {
          filter: brightness(1.35);
          box-shadow: 0 0 8px currentColor;
          outline: 1px solid currentColor;
        }
        .order-flag-badge.flag-pinned {
          filter: brightness(1.5);
          box-shadow: 0 0 12px currentColor;
          outline: 2px solid currentColor;
        }

        /* dimmed service cards */
        .service-card-v.flag-dimmed {
          opacity: 0.2;
          filter: grayscale(0.8);
          pointer-events: none;
          transition: opacity 0.2s, filter 0.2s;
        }
        .service-card-v:not(.flag-dimmed) {
          transition: opacity 0.2s, filter 0.2s;
        }

        /* flag hint bar */
        .flag-hint-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 1rem;
          background: rgba(99,102,241,0.08);
          border-bottom: 1px solid rgba(99,102,241,0.2);
          font-size: 0.78rem;
          color: #a5b4fc;
          animation: fadein 0.15s ease;
        }
        .filter-bonus-pill {
          flex-shrink: 0;
          background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.25);
          border-radius: 99px;
          padding: 2px 10px;
          font-size: 0.72rem;
          color: #94a3b8;
          white-space: nowrap;
        }
        @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }

        /* ── DG warning banner ── */
        .dg-warning-banner {
          display: flex;
          gap: 0.6rem;
          align-items: flex-start;
          margin-top: 0.5rem;
          padding: 0.5rem 0.8rem;
          background: rgba(245,158,11,0.08);
          border: 1px solid rgba(245,158,11,0.35);
          border-radius: 6px;
          font-size: 0.76rem;
          color: #fcd34d;
          line-height: 1.5;
        }
        .dg-warning-banner span:first-child { font-size: 1rem; flex-shrink: 0; margin-top: 1px; }
        
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
