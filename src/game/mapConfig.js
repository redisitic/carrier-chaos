// ── Map layout ───────────────────────────────────────────────────────────────
// The 3D map is a 40×40 unit grid centered at (0,0).
// Terrain biomes occupy quadrants. Warehouse sits at center.

export const MAP_SIZE = 40;

// Biome quadrant centers & colors
export const BIOMES = {
  Urban: {
    center: [-8, 0, -8],
    color: "#64748b",      // slate
    groundColor: "#475569",
    heightScale: 0.15,
    label: "🏙️ Urban",
  },
  Rugged: {
    center: [8, 0, -8],
    color: "#92400e",      // amber-brown
    groundColor: "#78350f",
    heightScale: 0.8,
    label: "🪨 Rugged",
  },
  Waterway: {
    center: [-8, 0, 8],
    color: "#0e7490",      // cyan
    groundColor: "#155e75",
    heightScale: 0.05,
    label: "🌊 Waterway",
  },
  Mountain: {
    center: [8, 0, 8],
    color: "#6d28d9",      // purple
    groundColor: "#4c1d95",
    heightScale: 1.6,
    label: "⛰️ Mountain",
  },
};

// Generate a destination position within a biome
export function getDeliveryPosition(terrain) {
  const biome = BIOMES[terrain];
  if (!biome) return [0, 0.2, 0];
  const [cx, , cz] = biome.center;
  const spread = 5;
  const x = cx + (Math.random() - 0.5) * spread * 2;
  const z = cz + (Math.random() - 0.5) * spread * 2;
  const y = 0.2 + Math.random() * biome.heightScale * 0.5;
  return [x, y, z];
}

// Warehouse position
export const WAREHOUSE_POS = [0, 0, 0];

// Carrier visual configs for 3D
export const CARRIER_3D = {
  CityExpress: { bodyColor: "#3b82f6", scale: 0.5, type: "truck" },
  EcoShip:     { bodyColor: "#22c55e", scale: 0.45, type: "van" },
  MountainGo:  { bodyColor: "#f97316", scale: 0.5, type: "helicopter" },
  RiverLine:   { bodyColor: "#06b6d4", scale: 0.55, type: "ship" },
};
