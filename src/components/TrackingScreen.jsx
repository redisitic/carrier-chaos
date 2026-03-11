import { useState } from "react";
import { useGame } from "../context/GameContext";
import { TRACKING_EVENTS, CARRIERS } from "../game/constants";

const EVENT_MAP = {};
TRACKING_EVENTS.forEach((e) => { EVENT_MAP[e.code] = e; });

function getCarrierInfo(name) {
  return CARRIERS.find((c) => c.name === name) || { icon: "📦", color: "#64748b" };
}

const FILTERS = [
  { key: "all", label: "All", icon: "📋" },
  { key: "active", label: "In Transit", icon: "🚛" },
  { key: "delivered", label: "Delivered", icon: "✅" },
  { key: "failed", label: "Failed", icon: "❌" },
  { key: "expired", label: "Expired", icon: "⏰" },
];

export default function TrackingScreen() {
  const { state } = useGame();
  const { activeDeliveries, completedDeliveries, failedDeliveries, expiredOrders, gameMinutes } = state;
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  // Build unified shipment list
  const allShipments = [
    ...activeDeliveries.map((d) => ({ ...d, _status: "active" })),
    ...completedDeliveries.map((d) => ({ ...d, _status: "delivered" })),
    ...failedDeliveries.map((d) => ({ ...d, _status: "failed" })),
    ...expiredOrders.map((d) => ({ ...d, _status: "expired" })),
  ];

  const filtered = filter === "all"
    ? allShipments
    : allShipments.filter((s) => s._status === filter);

  const counts = {
    all: allShipments.length,
    active: activeDeliveries.length,
    delivered: completedDeliveries.length,
    failed: failedDeliveries.length,
    expired: expiredOrders.length,
  };

  return (
    <div className="screen tracking-screen">
      <div className="panel full-width">
        <div className="panel-header">
          <h2>📡 Control Tower</h2>
          <span className="count-badge in-transit">{activeDeliveries.length} live</span>
        </div>

        {/* Filter tabs */}
        <div className="ct-filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`ct-filter-btn ${filter === f.key ? "active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
              <span className="ct-filter-count">{counts[f.key]}</span>
            </button>
          ))}
        </div>

        {/* Shipment list */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            {filter === "all"
              ? "No shipments yet. Dispatch orders from the Dashboard."
              : `No ${filter} shipments.`}
          </div>
        ) : (
          <div className="ct-shipment-list">
            {filtered.map((shipment) => {
              const carrier = getCarrierInfo(shipment.deliveryResult?.carrierName);
              const isExpanded = expandedId === shipment.id;
              const timeline = shipment.trackingTimeline || [];

              return (
                <div
                  key={shipment.id}
                  className={`ct-shipment-card ct-status-${shipment._status}`}
                  onClick={() => setExpandedId(isExpanded ? null : shipment.id)}
                >
                  {/* Header row */}
                  <div className="ct-ship-header">
                    <span className="ct-ship-id">{shipment.storeIcon} #{shipment.id}</span>
                    <span
                      className="ct-carrier-badge"
                      style={{ background: carrier.color }}
                    >
                      {carrier.icon} {shipment.deliveryResult?.carrierName} — {shipment.deliveryResult?.serviceName}
                    </span>
                    <span className="ct-zone-tag">📍 {shipment.zone}</span>
                    <span className={`ct-status-tag ct-tag-${shipment._status}`}>
                      {shipment._status === "active" ? "🚛 In Transit"
                        : shipment._status === "delivered" ? "✅ Delivered"
                          : shipment._status === "failed" ? "❌ Failed"
                            : "⏰ Expired"}
                    </span>
                    <span className="ct-expand-icon">{isExpanded ? "▲" : "▼"}</span>
                  </div>

                  {/* Summary row */}
                  <div className="ct-ship-meta">
                    <span>📦 {shipment.weight}kg</span>
                    <span>₹{shipment.deliveryResult?.cost}</span>
                    <span>SLA: {shipment.deliveryResult?.sla}</span>
                    {shipment.deliveryResult?.points > 0 && (
                      <span className="ct-points">+{shipment.deliveryResult.points}pts</span>
                    )}
                    {!shipment.deliveryResult?.zoneServed && (
                      <span className="warning-tag">⚠ Zone mismatch</span>
                    )}
                    {!shipment.deliveryResult?.dgCompliant && (
                      <span className="warning-tag">⚠ DG violation</span>
                    )}
                  </div>

                  {/* Progress bar for active */}
                  {shipment._status === "active" && (
                    <div className="ct-progress-bar">
                      <div
                        className="ct-progress-fill"
                        style={{
                          width: `${(timeline.filter((e) => e.triggered).length / Math.max(1, timeline.length)) * 100}%`,
                        }}
                      />
                    </div>
                  )}

                  {/* Expanded timeline */}
                  {isExpanded && timeline.length > 0 && (
                    <div className="ct-timeline">
                      {timeline.map((evt, i) => {
                        const meta = EVENT_MAP[evt.code] || { label: evt.code, icon: "📌" };
                        return (
                          <div
                            key={i}
                            className={`ct-timeline-event ${evt.triggered ? "triggered" : "pending"}`}
                          >
                            <div className="ct-tl-dot" />
                            <div className="ct-tl-line" />
                            <span className="ct-tl-icon">{meta.icon}</span>
                            <span className="ct-tl-label">{meta.label}</span>
                            {evt.triggered && <span className="ct-tl-check">✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
