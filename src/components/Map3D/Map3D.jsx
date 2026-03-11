import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Environment } from "@react-three/drei";
import { useGame } from "../../context/GameContext";
import Terrain from "./Terrain";
import Warehouse3D from "./Warehouse3D";
import DeliveryMarker from "./DeliveryMarker";
import { ActiveDelivery, DeliveryPath } from "./DeliveryRoute";
import WeatherEffects from "./WeatherEffects";
import { getDeliveryPosition } from "../../game/mapConfig";

function Scene() {
    const { state } = useGame();
    const { activeDeliveries, warehouseQueue, weather } = state;

    // Compute stable positions for queued orders (memoize by IDs)
    const queuedPositions = useMemo(() => {
        const map = {};
        for (const order of warehouseQueue) {
            map[order.id] = getDeliveryPosition(order.zone);
        }
        return map;
    }, [warehouseQueue.map((o) => o.id).join(",")]);

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight
                position={[15, 20, 10]}
                intensity={1.2}
                castShadow
                shadow-mapSize={[1024, 1024]}
                shadow-camera-left={-25}
                shadow-camera-right={25}
                shadow-camera-top={25}
                shadow-camera-bottom={-25}
            />
            <pointLight position={[0, 8, 0]} intensity={0.4} color="#6366f1" />

            {/* Background stars */}
            <Stars radius={100} depth={50} count={1500} factor={4} saturation={0} fade speed={1.5} />

            {/* Terrain */}
            <Terrain />

            {/* Warehouse */}
            <Warehouse3D />

            {/* Queued order markers (destination preview) */}
            {warehouseQueue.map((order) => (
                <DeliveryMarker
                    key={order.id}
                    order={order}
                    position={queuedPositions[order.id] || [0, 0, 0]}
                />
            ))}

            {/* Active delivery routes + animated carriers */}
            {activeDeliveries.map((delivery) => (
                <group key={delivery.id}>
                    <DeliveryPath delivery={delivery} />
                    <ActiveDelivery delivery={delivery} />
                </group>
            ))}

            {/* Camera controls */}
            <OrbitControls
                makeDefault
                enableDamping
                dampingFactor={0.1}
                minDistance={5}
                maxDistance={45}
                maxPolarAngle={Math.PI / 2.2}
                minPolarAngle={0.3}
                target={[0, 0, 0]}
            />

            {/* Ground plane for shadow receiving */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[60, 60]} />
                <shadowMaterial transparent opacity={0.3} />
            </mesh>

            {/* Weather particle systems */}
            <WeatherEffects />
        </>
    );
}

export default function Map3D() {
    const { state } = useGame();
    const weatherType = state.weather?.type || "clear";

    return (
        <div style={{
            width: "100%",
            height: "100%",
            background: "#0f172a",
            borderRadius: "10px",
            overflow: "hidden",
            position: "relative",
            transition: "background 2s ease",
            ...(weatherType === "fog" && { background: "#475569" }),
            ...(weatherType === "storm" && { background: "#1e293b" })
        }}>
            <Canvas
                shadows
                camera={{ position: [18, 16, 18], fov: 50, near: 0.1, far: 200 }}
                gl={{ antialias: true }}
                style={{ width: "100%", height: "100%" }}
            >
                {/* Dynamic scene fog depending on weather */}
                {weatherType === "fog" ? (
                    <fog attach="fog" args={["#475569", 15, 45]} />
                ) : weatherType === "storm" ? (
                    <fog attach="fog" args={["#1e293b", 25, 60]} />
                ) : weatherType === "rain" ? (
                    <fog attach="fog" args={["#0f172a", 30, 70]} />
                ) : (
                    <fog attach="fog" args={["#0f172a", 40, 100]} />
                )}

                <Suspense fallback={null}>
                    <Scene />
                </Suspense>
            </Canvas>

            {/* Map legend overlay */}
            <div style={{
                position: "absolute",
                bottom: "12px",
                left: "12px",
                background: "rgba(15,23,42,0.85)",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "8px 12px",
                display: "flex",
                gap: "12px",
                fontSize: "11px",
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                color: "#94a3b8",
                pointerEvents: "none",
            }}>
                <span><span style={{ color: "#06b6d4" }}>●</span> Metro</span>
                <span><span style={{ color: "#22c55e" }}>●</span> Tier-2</span>
                <span><span style={{ color: "#a16207" }}>●</span> Rural</span>
                <span><span style={{ color: "#f59e0b" }}>●</span> Hub</span>
            </div>

            {/* Controls hint */}
            <div style={{
                position: "absolute",
                bottom: "12px",
                right: "12px",
                background: "rgba(15,23,42,0.7)",
                border: "1px solid #334155",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "10px",
                color: "#64748b",
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                pointerEvents: "none",
            }}>
                🖱️ Orbit · Scroll to zoom · Right-drag to pan
            </div>
        </div>
    );
}
