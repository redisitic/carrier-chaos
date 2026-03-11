import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Low-poly 3D vehicle models ───────────────────────────────────────────────

export function Truck({ color = "#3b82f6", scale = 1 }) {
    const groupRef = useRef();
    // Wheel rotation
    useFrame(({ clock }) => {
        if (groupRef.current) {
            groupRef.current.children.forEach((child) => {
                if (child.userData.isWheel) {
                    child.rotation.x = clock.elapsedTime * 8;
                }
            });
        }
    });

    return (
        <group ref={groupRef} scale={scale}>
            {/* Cabin */}
            <mesh position={[0, 0.35, 0.35]} castShadow>
                <boxGeometry args={[0.7, 0.5, 0.5]} />
                <meshStandardMaterial color={color} flatShading />
            </mesh>
            {/* Windshield */}
            <mesh position={[0, 0.45, 0.6]}>
                <boxGeometry args={[0.55, 0.25, 0.02]} />
                <meshStandardMaterial color="#93c5fd" emissive="#3b82f6" emissiveIntensity={0.2} flatShading />
            </mesh>
            {/* Cargo box */}
            <mesh position={[0, 0.4, -0.3]} castShadow>
                <boxGeometry args={[0.75, 0.6, 0.8]} />
                <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.7)} flatShading />
            </mesh>
            {/* Wheels */}
            {[[-0.35, 0.1, 0.4], [0.35, 0.1, 0.4], [-0.35, 0.1, -0.5], [0.35, 0.1, -0.5]].map((pos, i) => (
                <mesh key={i} position={pos} rotation={[0, 0, Math.PI / 2]} userData={{ isWheel: true }}>
                    <cylinderGeometry args={[0.1, 0.1, 0.12, 6]} />
                    <meshStandardMaterial color="#1e293b" flatShading />
                </mesh>
            ))}
            {/* Headlights */}
            {[[-0.25, 0.3, 0.61], [0.25, 0.3, 0.61]].map((pos, i) => (
                <mesh key={`hl${i}`} position={pos}>
                    <sphereGeometry args={[0.04, 4, 4]} />
                    <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.8} />
                </mesh>
            ))}
        </group>
    );
}

export function Van({ color = "#22c55e", scale = 1 }) {
    return (
        <group scale={scale}>
            {/* Body */}
            <mesh position={[0, 0.3, 0]} castShadow>
                <boxGeometry args={[0.65, 0.45, 1.0]} />
                <meshStandardMaterial color={color} flatShading />
            </mesh>
            {/* Roof rounded */}
            <mesh position={[0, 0.58, -0.1]} castShadow>
                <boxGeometry args={[0.6, 0.1, 0.6]} />
                <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.85)} flatShading />
            </mesh>
            {/* Windshield */}
            <mesh position={[0, 0.4, 0.51]}>
                <boxGeometry args={[0.5, 0.2, 0.02]} />
                <meshStandardMaterial color="#bbf7d0" emissive="#22c55e" emissiveIntensity={0.15} flatShading />
            </mesh>
            {/* Leaf symbol on side */}
            <mesh position={[0.33, 0.35, 0]}>
                <boxGeometry args={[0.02, 0.15, 0.15]} />
                <meshStandardMaterial color="#166534" flatShading />
            </mesh>
            {/* Wheels */}
            {[[-0.3, 0.08, 0.3], [0.3, 0.08, 0.3], [-0.3, 0.08, -0.3], [0.3, 0.08, -0.3]].map((pos, i) => (
                <mesh key={i} position={pos} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.1, 6]} />
                    <meshStandardMaterial color="#1e293b" flatShading />
                </mesh>
            ))}
        </group>
    );
}

export function Ship({ color = "#06b6d4", scale = 1 }) {
    const groupRef = useRef();
    // Bobbing motion
    useFrame(({ clock }) => {
        if (groupRef.current) {
            groupRef.current.position.y = Math.sin(clock.elapsedTime * 2) * 0.05;
            groupRef.current.rotation.z = Math.sin(clock.elapsedTime * 1.5) * 0.04;
        }
    });

    return (
        <group ref={groupRef} scale={scale}>
            {/* Hull */}
            <mesh position={[0, 0.15, 0]} castShadow>
                <boxGeometry args={[0.5, 0.25, 1.2]} />
                <meshStandardMaterial color={color} flatShading />
            </mesh>
            {/* Hull bottom taper - front */}
            <mesh position={[0, 0.05, 0.5]} castShadow rotation={[0.3, 0, 0]}>
                <boxGeometry args={[0.4, 0.1, 0.4]} />
                <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.8)} flatShading />
            </mesh>
            {/* Cabin */}
            <mesh position={[0, 0.38, -0.15]} castShadow>
                <boxGeometry args={[0.35, 0.2, 0.35]} />
                <meshStandardMaterial color="#e2e8f0" flatShading />
            </mesh>
            {/* Smokestack */}
            <mesh position={[0.1, 0.55, -0.2]} castShadow>
                <cylinderGeometry args={[0.04, 0.05, 0.2, 5]} />
                <meshStandardMaterial color="#475569" flatShading />
            </mesh>
            {/* Deck cargo */}
            <mesh position={[0, 0.32, 0.2]} castShadow>
                <boxGeometry args={[0.3, 0.12, 0.4]} />
                <meshStandardMaterial color="#f59e0b" flatShading />
            </mesh>
        </group>
    );
}

export function Helicopter({ color = "#f97316", scale = 1 }) {
    const rotorRef = useRef();
    const tailRotorRef = useRef();

    useFrame(({ clock }) => {
        if (rotorRef.current) {
            rotorRef.current.rotation.y = clock.elapsedTime * 25;
        }
        if (tailRotorRef.current) {
            tailRotorRef.current.rotation.z = clock.elapsedTime * 30;
        }
    });

    return (
        <group scale={scale} position={[0, 0.8, 0]}>
            {/* Body */}
            <mesh castShadow>
                <sphereGeometry args={[0.3, 6, 5]} />
                <meshStandardMaterial color={color} flatShading />
            </mesh>
            {/* Tail boom */}
            <mesh position={[0, 0.05, -0.6]} castShadow>
                <boxGeometry args={[0.08, 0.1, 0.7]} />
                <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.8)} flatShading />
            </mesh>
            {/* Tail fin */}
            <mesh position={[0, 0.15, -0.9]} castShadow>
                <boxGeometry args={[0.02, 0.2, 0.15]} />
                <meshStandardMaterial color={color} flatShading />
            </mesh>
            {/* Windshield */}
            <mesh position={[0, 0.05, 0.25]}>
                <sphereGeometry args={[0.18, 5, 4, 0, Math.PI]} />
                <meshStandardMaterial color="#93c5fd" emissive="#3b82f6" emissiveIntensity={0.2} transparent opacity={0.7} flatShading />
            </mesh>
            {/* Main rotor mast */}
            <mesh position={[0, 0.32, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.08, 4]} />
                <meshStandardMaterial color="#64748b" flatShading />
            </mesh>
            {/* Main rotor blades */}
            <group ref={rotorRef} position={[0, 0.37, 0]}>
                <mesh>
                    <boxGeometry args={[1.4, 0.02, 0.08]} />
                    <meshStandardMaterial color="#94a3b8" flatShading />
                </mesh>
                <mesh rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[1.4, 0.02, 0.08]} />
                    <meshStandardMaterial color="#94a3b8" flatShading />
                </mesh>
            </group>
            {/* Tail rotor */}
            <group ref={tailRotorRef} position={[0.08, 0.15, -0.92]}>
                <mesh>
                    <boxGeometry args={[0.02, 0.3, 0.02]} />
                    <meshStandardMaterial color="#94a3b8" flatShading />
                </mesh>
            </group>
            {/* Skids */}
            {[-0.2, 0.2].map((x, i) => (
                <group key={i}>
                    <mesh position={[x, -0.25, 0]}>
                        <boxGeometry args={[0.03, 0.03, 0.6]} />
                        <meshStandardMaterial color="#64748b" flatShading />
                    </mesh>
                    <mesh position={[x, -0.15, 0.15]}>
                        <boxGeometry args={[0.03, 0.18, 0.03]} />
                        <meshStandardMaterial color="#64748b" flatShading />
                    </mesh>
                    <mesh position={[x, -0.15, -0.15]}>
                        <boxGeometry args={[0.03, 0.18, 0.03]} />
                        <meshStandardMaterial color="#64748b" flatShading />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

// ── Carrier selector ─────────────────────────────────────────────────────────
export default function CarrierModel({ type, color, scale = 1 }) {
    switch (type) {
        case "truck": return <Truck color={color} scale={scale} />;
        case "van": return <Van color={color} scale={scale} />;
        case "ship": return <Ship color={color} scale={scale} />;
        case "helicopter": return <Helicopter color={color} scale={scale} />;
        default: return <Truck color={color} scale={scale} />;
    }
}
