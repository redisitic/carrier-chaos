// ── Terrain ──────────────────────────────────────────────────────────────────
export const TERRAINS = ["Urban", "Rugged", "Waterway", "Mountain"];

export const TERRAIN_PENALTY = {
  Urban: 1.0,
  Rugged: 1.5,
  Waterway: 2.0,
  Mountain: 2.5,
};

// ── Carriers ─────────────────────────────────────────────────────────────────
export const CARRIERS = [
  {
    name: "CityExpress",
    speed: 90,
    costPerShipment: 40,
    preferredTerrains: ["Urban"],
    operatingHours: { start: 9, end: 17 },
    color: "#3b82f6",
    icon: "🚚",
  },
  {
    name: "EcoShip",
    speed: 45,
    costPerShipment: 20,
    preferredTerrains: ["Urban", "Rugged"],
    operatingHours: { start: 9, end: 17 },
    color: "#22c55e",
    icon: "🌿",
  },
  {
    name: "MountainGo",
    speed: 65,
    costPerShipment: 35,
    preferredTerrains: ["Mountain"],
    operatingHours: null, // 24h
    color: "#f97316",
    icon: "⛰️",
  },
  {
    name: "RiverLine",
    speed: 60,
    costPerShipment: 30,
    preferredTerrains: ["Waterway"],
    operatingHours: null, // 24h
    color: "#06b6d4",
    icon: "🚢",
  },
];

// ── Warehouse ─────────────────────────────────────────────────────────────────
export const WAREHOUSE = {
  openHour: 9,
  closeHour: 16,
  workers: 5,
  processingTimeHours: 1, // per shipment per worker
  capacity: 15,
};

// ── Player start ──────────────────────────────────────────────────────────────
export const INITIAL_PLAYER = {
  money: 1000,
  totalShipments: 20,
  xp: 0,
  points: 0,
};

// ── Scoring ───────────────────────────────────────────────────────────────────
export const SCORE = {
  successfulDelivery: 50,
  fastDelivery: 30,
  correctCarrier: 20,
  lateDelivery: -10,
  wrongTerrainCarrier: -20,
};

// ── Anomalies ─────────────────────────────────────────────────────────────────
export const ANOMALIES = [
  { type: "weather_delay", label: "Weather Delay", probability: 0.10, extraHours: 2 },
  { type: "carrier_breakdown", label: "Carrier Breakdown", probability: 0.05, extraHours: 3 },
  { type: "warehouse_overload", label: "Warehouse Overload", probability: 0.07, extraHours: 1 },
];

// ── Win / Lose thresholds ─────────────────────────────────────────────────────
export const WIN_CONDITION = { allDelivered: true, minFunds: 0 };
export const LOSE_CONDITIONS = { minFunds: 0, maxFailedShipments: 5 };

// ── Game clock ────────────────────────────────────────────────────────────────
// Each "tick" = 1 in-game minute. Real-time tick interval in ms.
export const TICK_INTERVAL_MS = 500;
export const MINUTES_PER_TICK = 15; // game advances 15 min per tick
