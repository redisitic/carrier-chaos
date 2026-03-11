import { useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { INDIA_OUTLINE, CITIES, ZONE_REGIONS, WAREHOUSE_POS } from "../../game/mapConfig";

// ── India-shaped 3D terrain ─────────────────────────────────────────────────
export default function Terrain() {
    const indiaShape = useMemo(() => {
        const shape = new THREE.Shape();
        if (INDIA_OUTLINE.length > 0) {
            shape.moveTo(INDIA_OUTLINE[0][0], INDIA_OUTLINE[0][1]);
            for (let i = 1; i < INDIA_OUTLINE.length; i++) {
                shape.lineTo(INDIA_OUTLINE[i][0], INDIA_OUTLINE[i][1]);
            }
            shape.closePath();
        }
        return shape;
    }, []);

    const extrudeSettings = useMemo(() => ({
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 2,
    }), []);

    return (
        <group>
            {/* Ocean base plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color="#0c1426" />
            </mesh>

            {/* India landmass — extruded shape */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0, 0]}
                receiveShadow
                castShadow
            >
                <extrudeGeometry args={[indiaShape, extrudeSettings]} />
                <meshStandardMaterial
                    color="#1e3a5f"
                    flatShading
                    roughness={0.8}
                    metalness={0.1}
                />
            </mesh>

            {/* Zone overlay patches — colored regions on top of India */}
            <ZoneOverlays />

            {/* City markers */}
            <CityMarkers />

            {/* Warehouse marker */}
            <WarehousePin />

            {/* India outline glow border */}
            <IndiaOutlineGlow />
        </group>
    );
}

// ── Glowing outline of India ────────────────────────────────────────────────
function IndiaOutlineGlow() {
    const points = useMemo(() => {
        return INDIA_OUTLINE.map(([x, z]) => new THREE.Vector3(x, 0.35, z));
    }, []);

    const lineGeo = useMemo(() => {
        return new THREE.BufferGeometry().setFromPoints(points);
    }, [points]);

    return (
        <line geometry={lineGeo}>
            <lineBasicMaterial color="#38bdf8" transparent opacity={0.4} linewidth={1} />
        </line>
    );
}

// ── Zone overlay patches ────────────────────────────────────────────────────
function ZoneOverlays() {
    // Place colored circles at city clusters to indicate zones
    const overlays = useMemo(() => {
        const items = [];
        Object.entries(CITIES).forEach(([name, city]) => {
            const region = ZONE_REGIONS[city.zone];
            if (!region) return;
            items.push(
                <mesh
                    key={name}
                    position={[city.pos[0], 0.32, city.pos[2]]}
                    rotation={[-Math.PI / 2, 0, 0]}
                >
                    <circleGeometry args={[1.2, 16]} />
                    <meshBasicMaterial
                        color={region.color}
                        transparent
                        opacity={0.15}
                    />
                </mesh>
            );
        });
        return items;
    }, []);

    return <>{overlays}</>;
}

// ── City pin markers ────────────────────────────────────────────────────────
function CityMarkers() {
    const markers = useMemo(() => {
        return Object.entries(CITIES).map(([name, city]) => {
            const region = ZONE_REGIONS[city.zone];
            const color = region?.color || "#6366f1";
            const [x, , z] = city.pos;
            const isMetro = city.zone === "India Metro";

            return (
                <group key={name} position={[x, 0.3, z]}>
                    {/* Pin dot */}
                    <mesh castShadow>
                        <sphereGeometry args={[isMetro ? 0.25 : 0.15, 8, 6]} />
                        <meshStandardMaterial
                            color={color}
                            emissive={color}
                            emissiveIntensity={isMetro ? 0.6 : 0.3}
                        />
                    </mesh>

                    {/* Glow ring for metro cities */}
                    {isMetro && (
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                            <ringGeometry args={[0.3, 0.5, 16]} />
                            <meshBasicMaterial color={color} transparent opacity={0.25} />
                        </mesh>
                    )}

                    {/* City name label */}
                    <Text
                        position={[0, isMetro ? 0.7 : 0.5, 0]}
                        fontSize={isMetro ? 0.35 : 0.25}
                        color="#e2e8f0"
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.02}
                        outlineColor="#0f172a"
                    >
                        {city.icon} {name}
                    </Text>
                </group>
            );
        });
    }, []);

    return <>{markers}</>;
}

// ── Warehouse pin at center ─────────────────────────────────────────────────
function WarehousePin() {
    const [x, y, z] = WAREHOUSE_POS;

    return (
        <group position={[x, y, z]}>
            {/* Base ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <ringGeometry args={[0.5, 0.8, 16]} />
                <meshBasicMaterial color="#f59e0b" transparent opacity={0.4} />
            </mesh>

            {/* Building body */}
            <mesh position={[0, 0.4, 0]} castShadow>
                <boxGeometry args={[0.8, 0.6, 0.6]} />
                <meshStandardMaterial color="#334155" />
            </mesh>

            {/* Roof */}
            <mesh position={[0, 0.75, 0]} castShadow>
                <boxGeometry args={[0.9, 0.1, 0.7]} />
                <meshStandardMaterial color="#475569" />
            </mesh>

            {/* Label */}
            <Text
                position={[0, 1.3, 0]}
                fontSize={0.35}
                color="#f59e0b"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.03}
                outlineColor="#0f172a"
            >
                📦 Centiro Hub
            </Text>
        </group>
    );
}
