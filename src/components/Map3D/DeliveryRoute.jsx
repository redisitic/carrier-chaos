import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import CarrierModel from "./CarrierModel";
import { CARRIER_3D, WAREHOUSE_POS, getDeliveryPosition } from "../../game/mapConfig";

// ── Single animated carrier on a delivery route ──────────────────────────────
export function ActiveDelivery({ delivery }) {
    const groupRef = useRef();
    const carrierName = delivery.deliveryResult?.carrierName;
    const carrierConfig = CARRIER_3D[carrierName] || { bodyColor: "#6366f1", scale: 0.5, type: "truck" };

    // Compute destination once per delivery
    const destination = useMemo(
        () => getDeliveryPosition(delivery.zone),
        [delivery.id, delivery.zone]
    );

    useFrame(() => {
        if (!groupRef.current) return;

        // Calculate progress (0 = at warehouse, 1 = at destination)
        const totalDuration = delivery.deliveryResult?.durationHours || 1;
        const trackingTimeline = delivery.trackingTimeline || [];
        const triggeredCount = trackingTimeline.filter(e => e.triggered).length;
        const progress = Math.max(0, Math.min(1, triggeredCount / Math.max(1, trackingTimeline.length)));

        // Lerp position from warehouse to destination
        const x = WAREHOUSE_POS[0] + (destination[0] - WAREHOUSE_POS[0]) * progress;
        const z = WAREHOUSE_POS[2] + (destination[2] - WAREHOUSE_POS[2]) * progress;

        // Height: slight arc for helicopters, ground level for others
        const arcHeight = carrierConfig.type === "helicopter" ? 2.0 : 0.15;
        const y = destination[1] + Math.sin(progress * Math.PI) * arcHeight;

        groupRef.current.position.set(x, y, z);

        // Face direction of travel
        const dx = destination[0] - WAREHOUSE_POS[0];
        const dz = destination[2] - WAREHOUSE_POS[2];
        if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
            groupRef.current.rotation.y = Math.atan2(dx, dz);
        }
    });

    return (
        <group ref={groupRef}>
            <CarrierModel
                type={carrierConfig.type}
                color={carrierConfig.bodyColor}
                scale={carrierConfig.scale}
            />

            {/* Anomaly effect */}
            {delivery.deliveryResult?.anomaly && <AnomalyEffect />}

            {/* Info label */}
            <Html position={[0, 1.2, 0]} center distanceFactor={12} style={{ pointerEvents: "none" }}>
                <div style={{
                    background: "rgba(15,23,42,0.85)",
                    border: `1px solid ${carrierConfig.bodyColor}`,
                    borderRadius: "6px",
                    padding: "2px 8px",
                    whiteSpace: "nowrap",
                    fontFamily: "'Segoe UI', system-ui, sans-serif",
                }}>
                    <span style={{ color: carrierConfig.bodyColor, fontSize: "10px", fontWeight: 700 }}>
                        #{delivery.id}
                    </span>
                    <span style={{ color: "#94a3b8", fontSize: "9px", marginLeft: "4px" }}>
                        {delivery.deliveryResult?.sla || ""}
                    </span>
                </div>
            </Html>
        </group>
    );
}

// ── Delivery path line from warehouse to destination ─────────────────────────
export function DeliveryPath({ delivery }) {
    const carrierName = delivery.deliveryResult?.carrierName;
    const carrierConfig = CARRIER_3D[carrierName] || { bodyColor: "#6366f1", scale: 0.5, type: "truck" };

    const destination = useMemo(
        () => getDeliveryPosition(delivery.zone),
        [delivery.id, delivery.zone]
    );

    const points = useMemo(() => {
        const start = new THREE.Vector3(...WAREHOUSE_POS).add(new THREE.Vector3(0, 0.1, 0));
        const end = new THREE.Vector3(...destination).add(new THREE.Vector3(0, 0.1, 0));
        return [start, end];
    }, [destination]);

    const lineGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

    return (
        <line geometry={lineGeo}>
            <lineBasicMaterial color={carrierConfig.bodyColor} transparent opacity={0.25} linewidth={1} />
        </line>
    );
}

// ── Anomaly warning effect ───────────────────────────────────────────────────
function AnomalyEffect() {
    const ref = useRef();

    useFrame(({ clock }) => {
        if (ref.current) {
            const s = 0.6 + Math.sin(clock.elapsedTime * 6) * 0.15;
            ref.current.scale.set(s, s, s);
            ref.current.material.opacity = 0.5 + Math.sin(clock.elapsedTime * 4) * 0.3;
        }
    });

    return (
        <mesh ref={ref} position={[0, 0.8, 0]}>
            <octahedronGeometry args={[0.2, 0]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.5} wireframe />
        </mesh>
    );
}
