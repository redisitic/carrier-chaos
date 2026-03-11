import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../../context/GameContext";

export default function WeatherEffects() {
    const { state } = useGame();
    const weatherType = state.weather?.type || "clear";

    return (
        <group>
            {/* Fog is handled at the Scene level in Map3D, but we render Rain/Storm particles here */}
            {(weatherType === "rain" || weatherType === "storm") && (
                <RainParticles isStorm={weatherType === "storm"} />
            )}
        </group>
    );
}

function RainParticles({ isStorm }) {
    const count = isStorm ? 3000 : 1000;
    const meshRef = useRef();

    const [positions, velocities] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const vel = new Float32Array(count); // vertical velocity

        for (let i = 0; i < count; i++) {
            // Spread across a 60x60 area above the map
            pos[i * 3] = (Math.random() - 0.5) * 60;
            pos[i * 3 + 1] = Math.random() * 20; // Start height between 0-20
            pos[i * 3 + 2] = (Math.random() - 0.5) * 60;

            vel[i] = 0.2 + Math.random() * 0.2; // Falling speed
        }
        return [pos, vel];
    }, [count]);

    useFrame((_, delta) => {
        if (!meshRef.current) return;
        const positions = meshRef.current.geometry.attributes.position.array;

        // Wind drift based on storm
        const driftX = isStorm ? delta * 15 : delta * 2;
        const fallSpeed = isStorm ? 1.5 : 1;

        for (let i = 0; i < count; i++) {
            // Update Y (falling)
            positions[i * 3 + 1] -= velocities[i] * fallSpeed;
            // Update X (wind drift)
            positions[i * 3] += driftX;

            // Reset drop if it hits the ground or goes too far sideways
            if (positions[i * 3 + 1] < 0) {
                positions[i * 3 + 1] = 20 + Math.random() * 5; // Reset to top
                positions[i * 3] = (Math.random() - 0.5) * 60; // Reset X
            }
            if (positions[i * 3] > 30) {
                positions[i * 3] = -30;
            }
        }
        meshRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={isStorm ? 0.08 : 0.05}
                color={isStorm ? "#94a3b8" : "#cbd5e1"}
                transparent
                opacity={isStorm ? 0.4 : 0.6}
                sizeAttenuation
                depthWrite={false}
            />
        </points>
    );
}
