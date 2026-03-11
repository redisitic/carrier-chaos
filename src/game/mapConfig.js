// ── Map layout — India Map Config ────────────────────────────────────────────

export const MAP_SIZE = 40;

// ── Major Indian Cities with real lat/lon ───────────────────────────────────
export const CITIES = {
  // Metro cities
  "Mumbai": { lat: 19.07, lon: 72.87, zone: "India Metro", icon: "🏙️" },
  "Delhi": { lat: 28.61, lon: 77.21, zone: "India Metro", icon: "🏛️" },
  "Bangalore": { lat: 12.97, lon: 77.59, zone: "India Metro", icon: "💻" },
  "Chennai": { lat: 13.08, lon: 80.27, zone: "India Metro", icon: "🏖️" },
  "Kolkata": { lat: 22.57, lon: 88.36, zone: "India Metro", icon: "🌉" },
  "Hyderabad": { lat: 17.38, lon: 78.47, zone: "India Metro", icon: "🕌" },

  // Tier-2 cities
  "Pune": { lat: 18.52, lon: 73.85, zone: "India Tier-2", icon: "🏭" },
  "Jaipur": { lat: 26.91, lon: 75.78, zone: "India Tier-2", icon: "🏰" },
  "Lucknow": { lat: 26.85, lon: 80.94, zone: "India Tier-2", icon: "🕌" },
  "Ahmedabad": { lat: 23.02, lon: 72.57, zone: "India Tier-2", icon: "🏗️" },
  "Chandigarh": { lat: 30.73, lon: 76.77, zone: "India Tier-2", icon: "🌳" },
  "Kochi": { lat: 9.93, lon: 76.26, zone: "India Tier-2", icon: "🚢" },
  "Indore": { lat: 22.72, lon: 75.85, zone: "India Tier-2", icon: "🏪" },
  "Nagpur": { lat: 21.14, lon: 79.08, zone: "India Tier-2", icon: "🍊" },

  // Rural reference points
  "Guwahati": { lat: 26.14, lon: 91.74, zone: "India Rural", icon: "🌿" },
  "Patna": { lat: 25.60, lon: 85.13, zone: "India Rural", icon: "🌾" },
  "Bhopal": { lat: 23.26, lon: 77.41, zone: "India Rural", icon: "🏛️" },
  "Shimla": { lat: 31.10, lon: 77.17, zone: "India Rural", icon: "⛰️" },
};

// Warehouse / central hub — Nagpur (geographic center of India)
export const WAREHOUSE_LAT_LON = [79.08, 21.14]; // [lon, lat] for Mapbox

// Get a random [lon, lat] near a city in the given zone
export function getDeliveryLatLon(zone) {
  const citiesInZone = Object.entries(CITIES).filter(([, c]) => c.zone === zone);
  if (citiesInZone.length === 0) return WAREHOUSE_LAT_LON;
  const [, city] = citiesInZone[Math.floor(Math.random() * citiesInZone.length)];
  return [
    city.lon + (Math.random() - 0.5) * 0.5,
    city.lat + (Math.random() - 0.5) * 0.5,
  ];
}

// Get a deterministic [lon, lat] for a specific order (consistent position)
export function getOrderCityLatLon(order) {
  const citiesInZone = Object.entries(CITIES).filter(([, c]) => c.zone === order.zone);
  if (citiesInZone.length === 0) return WAREHOUSE_LAT_LON;
  const idx = order.id % citiesInZone.length;
  const [, city] = citiesInZone[idx][1] ? [citiesInZone[idx][0], citiesInZone[idx][1]] : citiesInZone[0];
  return [city.lon, city.lat];
}

// ── Legacy compat for old 3D map (Terrain.jsx etc) ──────────────────────────
// These are still needed if the old React Three Fiber map is loaded
function projectToMap(lat, lon) {
  const x = ((lon - 82.5) / 14.5) * 18;
  const z = -((lat - 22.5) / 14.5) * 18;
  return [x, 0.25, z];
}

export const WAREHOUSE_POS = projectToMap(21.14, 79.08);

export function getDeliveryPosition(zone) {
  const citiesInZone = Object.entries(CITIES).filter(([, c]) => c.zone === zone);
  if (citiesInZone.length === 0) return [...WAREHOUSE_POS];
  const [, city] = citiesInZone[Math.floor(Math.random() * citiesInZone.length)];
  const [cx, cy, cz] = projectToMap(city.lat, city.lon);
  return [cx + (Math.random() - 0.5) * 2, cy, cz + (Math.random() - 0.5) * 2];
}

// Zone visual config
export const ZONE_REGIONS = {
  "India Metro": { color: "#06b6d4", groundColor: "#155e75", heightScale: 0.15, label: "🏙️ Metro" },
  "India Tier-2": { color: "#22c55e", groundColor: "#166534", heightScale: 0.25, label: "🌆 Tier-2" },
  "India Rural": { color: "#a16207", groundColor: "#78350f", heightScale: 0.5, label: "🌾 Rural" },
};

// Carrier 3D configs
export const CARRIER_3D = {
  FedEx: { bodyColor: "#4D148C", scale: 0.5, type: "truck" },
  UPS: { bodyColor: "#351C15", scale: 0.5, type: "truck" },
  DHL: { bodyColor: "#FFCC00", scale: 0.5, type: "van" },
  Delhivery: { bodyColor: "#E31E25", scale: 0.45, type: "van" },
  Bluedart: { bodyColor: "#003DA5", scale: 0.5, type: "truck" },
  "Swiss Post": { bodyColor: "#DC0018", scale: 0.45, type: "van" },
  Maersk: { bodyColor: "#0082ba", scale: 0.6, type: "ship" },
};

export const BIOMES = ZONE_REGIONS;

// India outline for old 3D map
export const INDIA_OUTLINE = [
  projectToMap(8.08, 77.55), projectToMap(9.5, 76.2), projectToMap(12.9, 74.8),
  projectToMap(15.4, 73.8), projectToMap(19.0, 72.8), projectToMap(21.1, 72.6),
  projectToMap(23.0, 70.0), projectToMap(23.7, 68.5), projectToMap(24.8, 68.9),
  projectToMap(27.0, 70.5), projectToMap(30.0, 74.0), projectToMap(32.5, 75.5),
  projectToMap(34.5, 77.5), projectToMap(32.0, 78.5), projectToMap(30.5, 79.0),
  projectToMap(28.5, 81.0), projectToMap(27.5, 84.0), projectToMap(26.5, 88.0),
  projectToMap(27.0, 89.5), projectToMap(27.5, 91.5), projectToMap(28.0, 94.0),
  projectToMap(27.0, 96.0), projectToMap(25.5, 94.5), projectToMap(24.0, 93.0),
  projectToMap(22.0, 92.0), projectToMap(21.5, 88.5), projectToMap(20.3, 87.0),
  projectToMap(17.7, 83.3), projectToMap(15.0, 80.2), projectToMap(13.0, 80.3),
  projectToMap(10.8, 79.8), projectToMap(8.08, 77.55),
].map(([x, , z]) => [x, z]);
