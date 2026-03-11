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
export const TICK_INTERVAL_MS = 1000;   // 1 second per tick (was 500ms)
export const MINUTES_PER_TICK = 5;      // 5 in-game minutes per tick (was 15)

// Speed multiplier options (accessed via HUD speed controls)
export const SPEED_OPTIONS = [
  { label: "1×", multiplier: 1, interval: 1000, minutes: 5 },
  { label: "2×", multiplier: 2, interval: 500, minutes: 5 },
  { label: "3×", multiplier: 3, interval: 300, minutes: 5 },
];

// ── Rush hours (for dynamic pricing) ──────────────────────────────────────────
export const RUSH_HOURS = [
  { start: 9, end: 10 },    // morning rush
  { start: 15, end: 16 },   // afternoon rush
];
export const RUSH_MULTIPLIER = 1.5;

// ── Weather ───────────────────────────────────────────────────────────────────
export const WEATHER_TYPES = [
  { type: "clear", label: "Clear", icon: "☀️", deliveryMultiplier: 1.0, terrainEffect: null },
  { type: "rain", label: "Rain", icon: "🌧️", deliveryMultiplier: 1.15, terrainEffect: null },
  { type: "storm", label: "Storm", icon: "⛈️", deliveryMultiplier: 1.4, terrainEffect: null },
  { type: "fog", label: "Fog", icon: "🌫️", deliveryMultiplier: 1.25, terrainEffect: "Waterway" },
  { type: "wind", label: "Wind", icon: "💨", deliveryMultiplier: 1.1, terrainEffect: "Mountain" },
];

// Weather transition probabilities (from → to)
export const WEATHER_TRANSITIONS = {
  clear: { clear: 0.6, rain: 0.2, fog: 0.1, wind: 0.1, storm: 0 },
  rain: { clear: 0.3, rain: 0.3, fog: 0.05, wind: 0.05, storm: 0.3 },
  storm: { clear: 0.1, rain: 0.5, fog: 0.1, wind: 0.2, storm: 0.1 },
  fog: { clear: 0.5, rain: 0.2, fog: 0.2, wind: 0.1, storm: 0 },
  wind: { clear: 0.4, rain: 0.1, fog: 0.05, wind: 0.3, storm: 0.15 },
};

// Weather changes every N in-game minutes
export const WEATHER_CHANGE_INTERVAL = 120; // every 2 hours

