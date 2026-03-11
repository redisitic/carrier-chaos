import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useGame } from "../../context/GameContext";

export default function Warehouse3D() {
    const { state } = useGame();
    const glowRef = useRef();
    const queueCount = state.warehouseQueue.length;

    // Pulse glow ring when orders are in queue
    useFrame(({ clock }) => {
        if (glowRef.current) {
            const pulse = 0.8 + Math.sin(clock.elapsedTime * 3) * 0.2;
            glowRef.current.scale.set(pulse, 1, pulse);
            glowRef.current.material.opacity = queueCount > 0 ? 0.4 + Math.sin(clock.elapsedTime * 2) * 0.2 : 0.1;
        }
    });

    return (
        <group position={[0, 0, 0]}>
            {/* Foundation platform */}
            <mesh position={[0, 0.05, 0]} receiveShadow>
                <cylinderGeometry args={[2.2, 2.4, 0.1, 8]} />
                <meshStandardMaterial color="#334155" flatShading />
            </mesh>

            {/* Main building */}
            <mesh position={[0, 0.6, 0]} castShadow>
                <boxGeometry args={[2.0, 1.0, 1.6]} />
                <meshStandardMaterial color="#475569" flatShading />
            </mesh>

            {/* Roof */}
            <mesh position={[0, 1.25, 0]} castShadow>
                <boxGeometry args={[2.2, 0.15, 1.8]} />
                <meshStandardMaterial color="#64748b" flatShading />
            </mesh>

            {/* Roof peak */}
            <mesh position={[0, 1.6, 0]} castShadow rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[0.7, 0.6, 4]} />
                <meshStandardMaterial color="#94a3b8" flatShading />
            </mesh>

            {/* Loading dock door */}
            <mesh position={[0, 0.4, 0.81]}>
                <boxGeometry args={[0.8, 0.6, 0.02]} />
                <meshStandardMaterial color="#f59e0b" flatShading />
            </mesh>

            {/* Small door */}
            <mesh position={[-0.6, 0.35, 0.81]}>
                <boxGeometry args={[0.35, 0.5, 0.02]} />
                <meshStandardMaterial color="#1e293b" flatShading />
            </mesh>

            {/* Windows */}
            {[[-0.5, 0.75, 0.81], [0.5, 0.75, 0.81], [-0.5, 0.75, -0.81], [0.5, 0.75, -0.81]].map((pos, i) => (
                <mesh key={i} position={pos}>
                    <boxGeometry args={[0.25, 0.2, 0.02]} />
                    <meshStandardMaterial color="#93c5fd" emissive="#3b82f6" emissiveIntensity={0.3} flatShading />
                </mesh>
            ))}

            {/* Glow ring for activity indicator */}
            <mesh ref={glowRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[2.3, 2.6, 16]} />
                <meshBasicMaterial color="#6366f1" transparent opacity={0.2} />
            </mesh>

            {/* HUD label floating above */}
            <Html position={[0, 2.5, 0]} center distanceFactor={15} style={{ pointerEvents: "none" }}>
                <div style={{
                    background: "rgba(15,23,42,0.85)",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    padding: "4px 10px",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    fontFamily: "'Segoe UI', system-ui, sans-serif",
                }}>
                    <div style={{ color: "#e2e8f0", fontSize: "11px", fontWeight: 700 }}>📦 Warehouse</div>
                    <div style={{ color: queueCount > 0 ? "#f59e0b" : "#64748b", fontSize: "10px" }}>
                        {queueCount} order{queueCount !== 1 ? "s" : ""} queued
                    </div>
                </div>
            </Html>
        </group>
    );
}
