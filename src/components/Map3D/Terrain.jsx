import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BIOMES, MAP_SIZE } from "../../game/mapConfig";
import { Text, MeshDistortMaterial } from "@react-three/drei";

// ── Simple seeded pseudo-noise for terrain height ──
function hash(x, z) {
    let h = x * 374761393 + z * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return ((h ^ (h >> 16)) & 0x7fffffff) / 0x7fffffff;
}

function smoothNoise(x, z) {
    const ix = Math.floor(x), iz = Math.floor(z);
    const fx = x - ix, fz = z - iz;
    const sx = fx * fx * (3 - 2 * fx);
    const sz = fz * fz * (3 - 2 * fz);
    const a = hash(ix, iz), b = hash(ix + 1, iz);
    const c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
    return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz;
}

function getTerrainForPoint(x, z) {
    if (x <= 0 && z <= 0) return "Urban";
    if (x > 0 && z <= 0) return "Rugged";
    if (x <= 0 && z > 0) return "Waterway";
    return "Mountain";
}

const SEG = 80; // grid segments

export default function Terrain() {
    const meshRef = useRef();
    const waterRef = useRef();

    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE, SEG, SEG);
        geo.rotateX(-Math.PI / 2);
        const pos = geo.attributes.position;
        const colors = new Float32Array(pos.count * 3);
        const color = new THREE.Color();

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const terrain = getTerrainForPoint(x, z);
            const biome = BIOMES[terrain];

            // Height from noise
            const noiseVal = smoothNoise(x * 0.3, z * 0.3);
            let h = noiseVal * biome.heightScale;

            // Roads: Flatten and darken cross-shaped paths from the warehouse
            const isRoadX = Math.abs(x) < 1.5 && Math.abs(z) > 3 && Math.abs(z) < MAP_SIZE / 2;
            const isRoadZ = Math.abs(z) < 1.5 && Math.abs(x) > 3 && Math.abs(x) < MAP_SIZE / 2;
            const isRoad = isRoadX || isRoadZ;

            // Flatten around warehouse center
            const distFromCenter = Math.sqrt(x * x + z * z);
            if (distFromCenter < 3) {
                h *= distFromCenter / 3;
            }

            if (isRoad) {
                h = 0.05; // Slightly above ground but flat
            }

            // Waterway is below sea level (negative y) except edges
            if (terrain === "Waterway" && !isRoad) {
                h = -0.15 + noiseVal * 0.1;
            }

            pos.setY(i, h);

            // Vertex colors
            if (isRoad) {
                // Dark asphalt color for roads
                colors[i * 3] = 0.2;
                colors[i * 3 + 1] = 0.2;
                colors[i * 3 + 2] = 0.23;
            } else {
                const lightness = 0.7 + noiseVal * 0.3;
                color.set(biome.groundColor);
                color.multiplyScalar(lightness);
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;
            }
        }

        geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geo.computeVertexNormals();
        return geo;
    }, []);

    // Animate water plane gentle wave
    useFrame(({ clock }) => {
        if (waterRef.current) {
            waterRef.current.position.y = -0.08 + Math.sin(clock.elapsedTime * 0.8) * 0.03;
        }
    });

    return (
        <group>
            {/* Main terrain */}
            <mesh ref={meshRef} geometry={geometry} receiveShadow>
                <meshStandardMaterial vertexColors flatShading />
            </mesh>

            {/* Water plane for Waterway biome */}
            <mesh ref={waterRef} position={[-8, -0.05, 8]} receiveShadow>
                <planeGeometry args={[MAP_SIZE / 2 + 2, MAP_SIZE / 2 + 2, 32, 32]} />
                <MeshDistortMaterial
                    color="#0ea5e9"
                    transparent
                    opacity={0.7}
                    distort={0.4}
                    speed={2}
                    roughness={0.1}
                    metalness={0.8}
                />
            </mesh>

            {/* Zone boundary lines */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.08, MAP_SIZE]} />
                <meshBasicMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
                <planeGeometry args={[0.08, MAP_SIZE]} />
                <meshBasicMaterial color="#334155" />
            </mesh>

            {/* Biome labels */}
            {Object.entries(BIOMES).map(([name, biome]) => (
                <Text
                    key={name}
                    position={[biome.center[0], 2.5, biome.center[2]]}
                    fontSize={0.9}
                    color="#e2e8f0"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.04}
                    outlineColor="#0f172a"
                    font={undefined}
                >
                    {biome.label}
                </Text>
            ))}

            {/* Low-poly trees / urban buildings scattered on terrain */}
            <BiomeDetails />
        </group>
    );
}

// ── Procedural decorations per biome ──
function BiomeDetails() {
    const details = useMemo(() => {
        const items = [];
        const rng = (seed) => {
            let s = seed;
            return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
        };
        const r = rng(42);

        // Urban - varied buildings
        for (let i = 0; i < 35; i++) {
            const x = -2 - r() * 14;
            const z = -2 - r() * 14;
            // Prevent buildings spawning on the road
            if (Math.abs(x) < 2 || Math.abs(z) < 2) continue;

            const h = 0.4 + r() * 1.8;
            const w = 0.3 + r() * 0.6;
            const hue = 210 + r() * 30; // Blue/gray variants
            const isTall = h > 1.2;

            items.push(
                <group key={`b${i}`} position={[x, h / 2, z]}>
                    <mesh castShadow>
                        <boxGeometry args={[w, h, w]} />
                        <meshStandardMaterial color={`hsl(${hue}, ${15 + r() * 15}%, ${30 + r() * 20}%)`} flatShading />
                    </mesh>
                    {/* Tiny roof detail for tall buildings */}
                    {isTall && (
                        <mesh position={[0, h / 2 + 0.1, 0]} castShadow>
                            <boxGeometry args={[w * 0.5, 0.2, w * 0.5]} />
                            <meshStandardMaterial color="#334155" />
                        </mesh>
                    )}
                </group>
            );
        }

        // Rugged - rocks
        for (let i = 0; i < 18; i++) {
            const x = 2 + r() * 14;
            const z = -2 - r() * 14;
            const s = 0.2 + r() * 0.6;
            items.push(
                <mesh key={`r${i}`} position={[x, s * 0.4, z]} castShadow rotation={[r() * 0.5, r() * Math.PI, 0]}>
                    <dodecahedronGeometry args={[s, 0]} />
                    <meshStandardMaterial color={`hsl(30, ${30 + r() * 20}%, ${25 + r() * 15}%)`} flatShading />
                </mesh>
            );
        }

        // Mountain - stacked multi-tier pine trees
        for (let i = 0; i < 25; i++) {
            const x = 2 + r() * 14;
            const z = 2 + r() * 14;
            // Prevent trees on road
            if (Math.abs(x) < 2 || Math.abs(z) < 2) continue;

            const h = 0.6 + r() * 1.4;
            const width = 0.4 + r() * 0.3;
            const color = `hsl(150, ${40 + r() * 20}%, ${20 + r() * 15}%)`;

            items.push(
                <group key={`m${i}`} position={[x, 0, z]}>
                    {/* Tree trunk */}
                    <mesh position={[0, h * 0.2, 0]} castShadow>
                        <cylinderGeometry args={[0.06, 0.08, h * 0.4, 5]} />
                        <meshStandardMaterial color="#4a3018" flatShading />
                    </mesh>
                    {/* Tree canopy tiers */}
                    <mesh position={[0, h * 0.5, 0]} castShadow>
                        <coneGeometry args={[width, h * 0.6, 6]} />
                        <meshStandardMaterial color={color} flatShading />
                    </mesh>
                    <mesh position={[0, h * 0.75, 0]} castShadow>
                        <coneGeometry args={[width * 0.7, h * 0.5, 6]} />
                        <meshStandardMaterial color={color} flatShading />
                    </mesh>
                    <mesh position={[0, h * 0.95, 0]} castShadow>
                        <coneGeometry args={[width * 0.4, h * 0.4, 6]} />
                        <meshStandardMaterial color={color} flatShading />
                    </mesh>
                </group>
            );
        }

        // Waterway - reeds / small islands
        for (let i = 0; i < 8; i++) {
            const x = -3 - r() * 12;
            const z = 3 + r() * 12;
            const s = 0.15 + r() * 0.3;
            items.push(
                <mesh key={`w${i}`} position={[x, 0, z]} castShadow>
                    <sphereGeometry args={[s, 6, 4]} />
                    <meshStandardMaterial color="#166534" flatShading />
                </mesh>
            );
        }

        return items;
    }, []);

    return <>{details}</>;
}
