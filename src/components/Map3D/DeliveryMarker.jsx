import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { BIOMES } from "../../game/mapConfig";

export default function DeliveryMarker({ order, position }) {
    const markerRef = useRef();
    const ringRef = useRef();
    const zone = order.zone;
    const biome = BIOMES[zone];
    const color = biome?.color || "#6366f1";

    // Floating / pulsing animation
    useFrame(({ clock }) => {
        if (markerRef.current) {
            markerRef.current.position.y = position[1] + 0.5 + Math.sin(clock.elapsedTime * 2 + order.id) * 0.15;
        }
        if (ringRef.current) {
            const s = 1 + Math.sin(clock.elapsedTime * 3 + order.id * 0.7) * 0.2;
            ringRef.current.scale.set(s, s, s);
            ringRef.current.material.opacity = 0.3 + Math.sin(clock.elapsedTime * 2) * 0.15;
        }
    });

    return (
        <group position={position}>
            {/* Ground ring */}
            <mesh ref={ringRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.3, 0.45, 12]} />
                <meshBasicMaterial color={color} transparent opacity={0.3} />
            </mesh>

            {/* Pin body */}
            <group ref={markerRef}>
                {/* Pin sphere */}
                <mesh castShadow>
                    <sphereGeometry args={[0.2, 8, 6]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} flatShading />
                </mesh>

                {/* Pin stem */}
                <mesh position={[0, -0.35, 0]}>
                    <coneGeometry args={[0.08, 0.35, 4]} />
                    <meshStandardMaterial color={color} flatShading />
                </mesh>

                {/* Label */}
                <Html position={[0, 0.4, 0]} center distanceFactor={12} style={{ pointerEvents: "none" }}>
                    <div style={{
                        background: "rgba(15,23,42,0.9)",
                        border: `1px solid ${color}`,
                        borderRadius: "6px",
                        padding: "2px 8px",
                        whiteSpace: "nowrap",
                        fontFamily: "'Segoe UI', system-ui, sans-serif",
                    }}>
                        <span style={{ color: "#e2e8f0", fontSize: "10px", fontWeight: 700 }}>
                            #{order.id}
                        </span>
                        <span style={{ color, fontSize: "9px", marginLeft: "4px" }}>
                            {order.distance}km
                        </span>
                    </div>
                </Html>
            </group>
        </group>
    );
}
