import { useRef, useEffect } from "react";

/**
 * Animated carrier icon component.
 * Renders a CSS-animated carrier with unique motion per type.
 * 
 * Props:
 *   type: "truck" | "van" | "ship" | "helicopter"
 *   color: carrier color string
 *   size: pixel size (default 48)
 *   animate: boolean (default true)
 */
export default function AnimatedCarrier({ type = "truck", color = "#3b82f6", size = 48, animate = true }) {
    const style = {
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.6,
        position: "relative",
        animation: animate ? undefined : "none",
    };

    switch (type) {
        case "truck":
            return (
                <div className="sprite-truck" style={style}>
                    <span className="sprite-body">🚚</span>
                    <div className="sprite-wheels">
                        <span className="sprite-wheel" style={{ left: "20%", background: color }} />
                        <span className="sprite-wheel" style={{ left: "65%", background: color }} />
                    </div>
                    {animate && <div className="sprite-exhaust" />}
                </div>
            );

        case "van":
            return (
                <div className="sprite-van" style={style}>
                    <span className="sprite-body">🌿</span>
                    <div className="sprite-leaf-particles">
                        {animate && [0, 1, 2].map(i => (
                            <span key={i} className="leaf-particle" style={{ animationDelay: `${i * 0.3}s`, color }} />
                        ))}
                    </div>
                </div>
            );

        case "helicopter":
            return (
                <div className="sprite-helicopter" style={style}>
                    <span className="sprite-body">⛰️</span>
                    {animate && <div className="sprite-rotor" style={{ borderColor: color }} />}
                    {animate && <div className="sprite-downdraft" />}
                </div>
            );

        case "ship":
            return (
                <div className="sprite-ship" style={style}>
                    <span className="sprite-body">🚢</span>
                    {animate && (
                        <div className="sprite-waves">
                            <span className="wave wave-1" style={{ background: color }} />
                            <span className="wave wave-2" style={{ background: color }} />
                        </div>
                    )}
                </div>
            );

        default:
            return <span style={{ fontSize: size * 0.6 }}>📦</span>;
    }
}

/**
 * Small inline animated carrier badge for tracking cards.
 */
export function CarrierBadgeAnimated({ carrierName, size = 24 }) {
    const config = {
        CityExpress: { type: "truck", color: "#3b82f6", icon: "🚚" },
        EcoShip: { type: "van", color: "#22c55e", icon: "🌿" },
        MountainGo: { type: "helicopter", color: "#f97316", icon: "⛰️" },
        RiverLine: { type: "ship", color: "#06b6d4", icon: "🚢" },
    };
    const c = config[carrierName] || config.CityExpress;

    return <AnimatedCarrier type={c.type} color={c.color} size={size} />;
}
