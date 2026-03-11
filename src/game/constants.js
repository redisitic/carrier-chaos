// ══════════════════════════════════════════════════════════════════════════════
// CarrierChaos v2 — Centiro TMS Simulator Constants
// ══════════════════════════════════════════════════════════════════════════════

// ── Destination Zones ────────────────────────────────────────────────────────
export const ZONES = [
  "India Metro",
  "India Tier-2",
  "India Rural",
];

export const DOMESTIC_ZONES = ["India Metro", "India Tier-2", "India Rural"];

// Zone distance ranges (km) — affects transit time
export const ZONE_DISTANCE = {
  "India Metro": { min: 10, max: 150 },
  "India Tier-2": { min: 100, max: 500 },
  "India Rural": { min: 200, max: 800 },
};

// ── Stores (Order Sources) ──────────────────────────────────────────────────
export const STORES = [
  {
    name: "Nike",
    icon: "👟",
    category: "Apparel & Footwear",
    avgWeight: { min: 0.5, max: 5 },
    avgValue: { min: 3000, max: 15000 },
    dgChance: 0,
    fragileChance: 0.05,
    zones: ["India Metro", "India Tier-2"],
    priorities: ["Express", "Standard"],
  },
  {
    name: "Samsung",
    icon: "📱",
    category: "Electronics",
    avgWeight: { min: 0.3, max: 15 },
    avgValue: { min: 5000, max: 50000 },
    dgChance: 0.15,     // batteries = DG
    fragileChance: 0.4,
    zones: ["India Metro", "India Tier-2", "India Rural"],
    priorities: ["Express", "Standard", "Economy"],
  },
  {
    name: "IKEA",
    icon: "🪑",
    category: "Furniture & Home",
    avgWeight: { min: 5, max: 50 },
    avgValue: { min: 2000, max: 25000 },
    dgChance: 0,
    fragileChance: 0.3,
    zones: ["India Metro", "India Tier-2"],
    priorities: ["Standard", "Economy"],
  },
  {
    name: "Pharma Plus",
    icon: "💊",
    category: "Pharmaceuticals",
    avgWeight: { min: 0.1, max: 2 },
    avgValue: { min: 500, max: 5000 },
    dgChance: 0.6,      // medicines often classified DG
    fragileChance: 0.2,
    zones: ["India Metro", "India Tier-2", "India Rural"],
    priorities: ["Express", "Standard"],
  },
];

// ── Carriers & Services (All India) ─────────────────────────────────────────
export const CARRIERS = [
  {
    name: "FedEx",
    icon: "📦",
    color: "#4D148C",
    reliability: 0.96,
    services: [
      { name: "Priority Express", sla: "same-day", costPerKg: 220, zones: ["India Metro"], dg: true, maxWeight: 20 },
      { name: "Standard Express", sla: "next-day", costPerKg: 150, zones: ["India Metro", "India Tier-2", "India Rural"], dg: true, maxWeight: 30 },
      { name: "Economy", sla: "3-5 day", costPerKg: 75, zones: ["India Metro", "India Tier-2", "India Rural"], dg: false, maxWeight: 50 },
    ],
  },
  {
    name: "UPS",
    icon: "🟤",
    color: "#351C15",
    reliability: 0.95,
    services: [
      { name: "Express Saver", sla: "next-day", costPerKg: 180, zones: ["India Metro", "India Tier-2"], dg: true, maxWeight: 25 },
      { name: "Standard", sla: "3-5 day", costPerKg: 85, zones: ["India Metro", "India Tier-2", "India Rural"], dg: false, maxWeight: 40 },
      { name: "Ground Freight", sla: "5-7 day", costPerKg: 40, zones: ["India Metro", "India Tier-2", "India Rural"], dg: false, maxWeight: 100 },
    ],
  },
  {
    name: "DHL",
    icon: "✈️",
    color: "#FFCC00",
    reliability: 0.97,
    services: [
      { name: "Express", sla: "same-day", costPerKg: 250, zones: ["India Metro"], dg: true, maxWeight: 15 },
      { name: "Domestic Economy", sla: "3-5 day", costPerKg: 90, zones: ["India Metro", "India Tier-2", "India Rural"], dg: true, maxWeight: 50 },
      { name: "eCommerce", sla: "5-7 day", costPerKg: 45, zones: ["India Metro", "India Tier-2", "India Rural"], dg: false, maxWeight: 30 },
    ],
  },
  {
    name: "Delhivery",
    icon: "🚛",
    color: "#E31E25",
    reliability: 0.91,
    services: [
      { name: "Express", sla: "next-day", costPerKg: 80, zones: ["India Metro", "India Tier-2", "India Rural"], dg: false, maxWeight: 20 },
      { name: "Standard", sla: "3-5 day", costPerKg: 40, zones: ["India Metro", "India Tier-2", "India Rural"], dg: false, maxWeight: 30 },
      { name: "Surface", sla: "5-7 day", costPerKg: 25, zones: ["India Metro", "India Tier-2", "India Rural"], dg: false, maxWeight: 50 },
    ],
  },
  {
    name: "Bluedart",
    icon: "🔵",
    color: "#003DA5",
    reliability: 0.93,
    services: [
      { name: "Dart Apex Plus", sla: "same-day", costPerKg: 150, zones: ["India Metro"], dg: true, maxWeight: 10 },
      { name: "Dart Apex", sla: "next-day", costPerKg: 90, zones: ["India Metro", "India Tier-2", "India Rural"], dg: true, maxWeight: 20 },
      { name: "Dart Surface", sla: "3-5 day", costPerKg: 35, zones: ["India Metro", "India Tier-2", "India Rural"], dg: false, maxWeight: 50 },
    ],
  },
  {
    name: "Swiss Post",
    icon: "🇨🇭",
    color: "#DC0018",
    reliability: 0.94,
    services: [
      { name: "Premium Express", sla: "next-day", costPerKg: 160, zones: ["India Metro"], dg: false, maxWeight: 15 },
      { name: "Standard", sla: "3-5 day", costPerKg: 65, zones: ["India Metro", "India Tier-2"], dg: false, maxWeight: 25 },
      { name: "Economy Surface", sla: "5-7 day", costPerKg: 30, zones: ["India Metro", "India Tier-2", "India Rural"], dg: false, maxWeight: 40 },
    ],
  },
];

// ── SLA to hours mapping ────────────────────────────────────────────────────
export const SLA_HOURS = {
  "same-day": 6,
  "next-day": 24,
  "3-5 day": 96,    // ~4 days avg
  "5-7 day": 144,   // ~6 days avg
};

// ── Deadline options ────────────────────────────────────────────────────────
export const DEADLINES = ["same-day", "next-day", "3-5 day", "5-7 day"];

// ── Priorities ──────────────────────────────────────────────────────────────
export const PRIORITIES = ["Express", "Standard", "Economy"];

// ── Scoring ─────────────────────────────────────────────────────────────────
export const SCORE = {
  slaMatch: 50,             // Service SLA meets or beats deadline
  slaMiss: -30,             // SLA exceeds deadline
  costEfficiency: 40,       // Cheapest valid option chosen
  costPenaltyRate: 0.5,     // Points lost per ₹ over the cheapest
  dgCompliance: 0,          // No bonus, just required
  dgViolation: -50,         // DG sent via non-DG carrier
  speedBonus: 20,           // Faster SLA than required
  fragileBonus: 15,         // Premium carrier for fragile
  fragilePenalty: -10,      // Economy carrier for fragile
  successfulDelivery: 50,   // Base delivery completion
  reliabilityFail: -40,     // Delivery failed due to carrier unreliability
};

// ── Player start ────────────────────────────────────────────────────────────
export const INITIAL_PLAYER = {
  money: 25000,       // ₹25,000 starting budget
  totalShipments: 25,
  xp: 0,
  points: 0,
};

// ── Win / Lose ──────────────────────────────────────────────────────────────
export const LOSE_CONDITIONS = { minFunds: 0, maxFailedShipments: 5 };

// ── Time pressure ───────────────────────────────────────────────────────────
export const ORDER_EXPIRY_MINUTES = 180;  // 3 in-game hours to assign

// ── Game clock ──────────────────────────────────────────────────────────────
export const TICK_INTERVAL_MS = 2000;
export const MINUTES_PER_TICK = 2;

export const SPEED_OPTIONS = [
  { label: "1×", multiplier: 1, interval: 2000, minutes: 2 },
  { label: "2×", multiplier: 2, interval: 1000, minutes: 2 },
  { label: "3×", multiplier: 3, interval: 600, minutes: 2 },
];

// ── Warehouse / Dashboard hours ─────────────────────────────────────────────
export const WAREHOUSE = {
  openHour: 8,
  closeHour: 18,
  capacity: 20,
};

// ── XP Levels ───────────────────────────────────────────────────────────────
export const XP_LEVELS = [
  { minXp: 0, level: 1, title: "Trainee" },
  { minXp: 80, level: 2, title: "Analyst" },
  { minXp: 200, level: 3, title: "Manager" },
  { minXp: 400, level: 4, title: "Director" },
  { minXp: 700, level: 5, title: "VP of Logistics" },
];

// ── Weather / Logistics Delays ──────────────────────────────────────────────
export const WEATHER_TYPES = [
  { type: "clear", label: "Clear Skies", icon: "☀️", deliveryMultiplier: 1.0, terrainEffect: null },
  { type: "monsoon", label: "Monsoon", icon: "🌧️", deliveryMultiplier: 1.3, terrainEffect: "India Rural" },
  { type: "fog", label: "Airport Fog", icon: "🌫️", deliveryMultiplier: 1.2, terrainEffect: null },
  { type: "strike", label: "Transport Strike", icon: "🚫", deliveryMultiplier: 1.5, terrainEffect: "India Tier-2" },
  { type: "customs", label: "Customs Backlog", icon: "📋", deliveryMultiplier: 1.4, terrainEffect: "India Metro" },
];

export const WEATHER_TRANSITIONS = {
  clear: { clear: 0.55, monsoon: 0.2, fog: 0.1, strike: 0.1, customs: 0.05 },
  monsoon: { clear: 0.3, monsoon: 0.35, fog: 0.1, strike: 0.15, customs: 0.1 },
  fog: { clear: 0.5, monsoon: 0.15, fog: 0.2, strike: 0.1, customs: 0.05 },
  strike: { clear: 0.4, monsoon: 0.1, fog: 0.05, strike: 0.3, customs: 0.15 },
  customs: { clear: 0.45, monsoon: 0.1, fog: 0.05, strike: 0.1, customs: 0.3 },
};

export const WEATHER_CHANGE_INTERVAL = 120; // every 2 in-game hours

// ── Tracking Event Codes ────────────────────────────────────────────────────
export const TRACKING_EVENTS = [
  { code: "ORDER_RECEIVED", label: "Order Received", icon: "📥" },
  { code: "CARRIER_ASSIGNED", label: "Carrier Assigned", icon: "🏷️" },
  { code: "PICKUP_SCHEDULED", label: "Pickup Scheduled", icon: "📅" },
  { code: "PICKED_UP", label: "Picked Up", icon: "📤" },
  { code: "IN_TRANSIT", label: "In Transit", icon: "🚛" },
  { code: "AT_HUB", label: "At Sorting Hub", icon: "🏭" },
  { code: "CUSTOMS_CLEARANCE", label: "Customs Clearance", icon: "🛃" },
  { code: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "🏍️" },
  { code: "DELIVERED", label: "Delivered", icon: "✅" },
  { code: "EXCEPTION", label: "Exception", icon: "⚠️" },
];

// ── Rush Hours (dynamic pricing) ────────────────────────────────────────────
export const RUSH_HOURS = [
  { start: 9, end: 10 },
  { start: 14, end: 15 },
];
export const RUSH_MULTIPLIER = 1.4;
