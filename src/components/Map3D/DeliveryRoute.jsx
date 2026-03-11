import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import CarrierModel from "./CarrierModel";
import { CARRIER_3D, WAREHOUSE_POS, getDeliveryPosition } from "../../game/mapConfig";

// Helper for computing curved paths
function getCurvePoints(startPos, endPos, type) {
    const start = new THREE.Vector3(...startPos).add(new THREE.Vector3(0, 0.1, 0));
    const end = new THREE.Vector3(...endPos).add(new THREE.Vector3(0, 0.1, 0));
    
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    
    if (type === "helicopter") {
        mid.y += 2.5; // High arc
    } else if (type === "ship") {
        // More curvy horizontal path to simulate rivers
        const dir = new THREE.Vector3().subVectors(end, start).normalize();
        const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(3.0);
        mid.add(side);
    } else {
        // Slight horizontal offset for trucks/vans to simulate roads
        const dir = new THREE.Vector3().subVectors(end, start).normalize();
        const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(1.2);
        mid.add(side);
    }

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(50);
}

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

    // Compute curved path for animation
    const pathPoints = useMemo(() => {
        return getCurvePoints(WAREHOUSE_POS, destination, carrierConfig.type);
    }, [destination, carrierConfig.type]);

    useFrame(() => {
        if (!groupRef.current || pathPoints.length < 2) return;

        // Calculate progress (0 = at warehouse, 1 = at destination)
        const trackingTimeline = delivery.trackingTimeline || [];
        const triggeredCount = trackingTimeline.filter(e => e.triggered).length;
        const progress = Math.max(0, Math.min(1, triggeredCount / Math.max(1, trackingTimeline.length)));

        // Get position along curved path
        const pointIdx = progress * (pathPoints.length - 1);
        const i = Math.floor(pointIdx);
        const f = pointIdx - i;
        
        const p1 = pathPoints[i];
        const p2 = pathPoints[i + 1] || p1;
        
        const pos = new THREE.Vector3().lerpVectors(p1, p2, f);
        groupRef.current.position.copy(pos);

        // Face direction of travel
        const nextIdx = Math.min(pathPoints.length - 1, i + 1);
        const nextP = pathPoints[nextIdx];
        const dx = nextP.x - p1.x;
        const dz = nextP.z - p1.z;
        if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
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
        return getCurvePoints(WAREHOUSE_POS, destination, carrierConfig.type);
    }, [destination, carrierConfig.type]);

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
