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
    lore: "FedEx — The Purple Machine. Born from the dreams of a Yale student who scraped a 'C' on the business plan that would change the world. Their overnight network stretches across every major Indian metro, humming 24 hours a day.",
    pros: ["Highest metro coverage", "DG certified on all tiers", "Industry-leading tracking"],
    cons: ["Premium pricing", "Metro-only for same-day"],
    services: [
      { name: "Priority Express", sla: "same-day", costPerKg: 220, zones: ["India Metro"], dg: true, maxWeight: 20, desc: "Guaranteed same-day delivery within metro limits. A fleet of dedicated vehicles with real-time GPS. For when it absolutely, positively has to be there today." },
      { name: "Standard Express", sla: "next-day", costPerKg: 150, zones: ["India Metro", "India Tier-2", "India Rural"], dg: true, maxWeight: 30, desc: "FedEx's backbone service. Overnight network spanning all India zones. Full DG clearance. Reliable enough that most enterprise SLAs are built around it." },
      { name: "Economy", sla: "3-5 day", costPerKg: 75, zones: ["India Metro", "India Tier-2", "India Rural"], dg: false, maxWeight: 50, desc: "Consolidated freight routed through regional hubs. Not glamorous, but cost-effective for non-urgent, non-DG cargo. Shares trucks with Standard Express overflow." },
    ],
  },
  {
    name: "UPS",
    icon: "🟤",
    color: "#8B5E3C",
    reliability: 0.95,
    lore: "UPS — Brown. Boring. Brilliant. United Parcel Service has been delivering since 1907. They invented the science of delivery route optimisation — their drivers turn left as rarely as possible to save fuel. In India, they dominate corporate B2B freight.",
    pros: ["Excellent B2B network", "High weight tolerance", "Ground freight specialty"],
    cons: ["No Rural same-day", "Lower DG tier vs FedEx"],
    services: [
      { name: "Express Saver", sla: "next-day", costPerKg: 180, zones: ["India Metro", "India Tier-2"], dg: true, maxWeight: 25, desc: "Next-day guaranteed, metro and Tier-2. UPS's premium domestic offering. DG certified. Marginally cheaper than FedEx for the same SLA, with slightly lower reliability." },
      { name: "Standard", sla: "3-5 day", costPerKg: 85, zones: ["India Metro", "India Tier-2", "India Rural"], dg: false, maxWeight: 40, desc: "UPS's standard ground network. Pan-India reach but no DG clearance. Solid mid-tier option for non-hazardous goods with moderate urgency." },
      { name: "Ground Freight", sla: "5-7 day", costPerKg: 40, zones: ["India Metro", "India Tier-2", "India Rural"], dg: false, maxWeight: 100, desc: "Heavy freight via road. The cheapest option that reaches Rural zones with 100kg capacity. Ideal for furniture and bulk orders. No DG." },
    ],
  },
  {
    name: "DHL",
    icon: "✈️",
    color: "#FFCC00",
    reliability: 0.97,
    lore: "DHL — Delivering Happiness Logistically. Founded in 1969 to courier documents between Honolulu and San Francisco. Now they move 1.8 billion parcels a year. In India, DHL's aviation connections make them the top pick for air-sensitive cargo.",
    pros: ["Highest reliability in market (97%)", "Best DG handling", "Widest air network"],
    cons: ["Most expensive same-day", "eCommerce tier lacks DG"],
    services: [
      { name: "Express", sla: "same-day", costPerKg: 250, zones: ["India Metro"], dg: true, maxWeight: 15, desc: "DHL's flagship same-day air service. Dedicated aircraft slots, individual parcel tracking, and DG Class 1-9 certified. The gold standard — at the gold standard price." },
      { name: "Domestic Economy", sla: "3-5 day", costPerKg: 90, zones: ["India Metro", "India Tier-2", "India Rural"], dg: true, maxWeight: 50, desc: "Economy air consolidated freight — rare to find DG clearance at this price tier. Routed through DHL's domestic sorting hubs. Significant savings over Express." },
      { name: "eCommerce", sla: "5-7 day", costPerKg: 45, zones: ["India Metro", "India Tier-2", "India Rural"], dg: false, maxWeight: 30, desc: "Built for high-volume e-commerce parcels. Last-mile via local partners. No DG. Cheapest DHL option by far, best for light non-hazardous goods." },
    ],
  },
  {
    name: "Delhivery",
    icon: "🚛",
    color: "#E31E25",
    reliability: 0.91,
    lore: "Delhivery — India's own logistics giant. Founded in 2011 in a Gurgaon garage by five ex-consultants. Now they run 24 automated sorting centers and 2,800 delivery points. They built their own route-optimisation AI. Affordable, scrappy, remarkably wide-reaching.",
    pros: ["Cheapest rates in market", "Pan-India including Rural", "Best for high-volume eCommerce"],
    cons: ["No DG certification", "Lower reliability (91%)", "No same-day service"],
    services: [
      { name: "Express", sla: "next-day", costPerKg: 80, zones: ["India Metro", "India Tier-2", "India Rural"], dg: false, maxWeight: 20, desc: "Delhivery's fastest tier. Next-day across all zones — rural included, which is rare at this price. No DG. Best budget next-day option for light consumer goods." },
      { name: "Standard", sla: "3-5 day", costPerKg: 40, zones: ["India Metro", "India Tier-2", "India Rural"], dg: false, maxWeight: 30, desc: "The crowd favourite for e-commerce. Extremely affordable, wide reach, solid tracking. Reliability takes a hit at 91% — expect occasional exceptions on bulk runs." },
      { name: "Surface", sla: "5-7 day", costPerKg: 25, zones: ["India Metro", "India Tier-2", "India Rural"], dg: false, maxWeight: 50, desc: "Ground surface freight at the lowest price point available. Suitable for bulky, non-urgent, non-hazardous cargo. Heavily consolidated — expect stops at multiple depots." },
    ],
  },
  {
    name: "Bluedart",
    icon: "🔵",
    color: "#003DA5",
    reliability: 0.93,
    lore: "Bluedart — India's original premium courier. Established 1983, acquired by DHL in 2004 but operates independently. They pioneered overnight delivery in India before most cities had proper roads. Their Dart brand is synonymous with speed among Indian CFOs.",
    pros: ["Strong same-day metro brand", "DG certified on Apex tiers", "Trusted by Indian enterprises"],
    cons: ["Low weight caps on premium tiers", "More expensive than Delhivery"],
    services: [
      { name: "Dart Apex Plus", sla: "same-day", costPerKg: 150, zones: ["India Metro"], dg: true, maxWeight: 10, desc: "Bluedart's top-tier same-day service. More affordable than DHL Express but with a strict 10kg weight cap. DG certified. For lightweight urgent items in metro zones." },
      { name: "Dart Apex", sla: "next-day", costPerKg: 90, zones: ["India Metro", "India Tier-2", "India Rural"], dg: true, maxWeight: 20, desc: "Classic overnight Bluedart. Pan-India coverage, DG handling, and a 20kg limit. The SME favourite for pharmaceutical and electronics shipments." },
      { name: "Dart Surface", sla: "3-5 day", costPerKg: 35, zones: ["India Metro", "India Tier-2", "India Rural"], dg: false, maxWeight: 50, desc: "Ground option leveraging DHL ground infrastructure post-2004 acquisition. No DG but excellent tracking and depot coverage across India." },
    ],
  },
  {
    name: "Maersk",
    icon: "🚢",
    color: "#0082ba",
    reliability: 0.94,
    lore: "Maersk — The Container King. A.P. Møller-Maersk has been sailing since 1904 and operates the world's largest container fleet. Their inland logistics arm in India handles coastal freight from Nhava Sheva to Krishnapatnam. Slow but unstoppable — like a fully-loaded bulk carrier.",
    pros: ["Handles heaviest cargo (up to 1000kg)", "Full DG certification", "Lowest ₹/kg on bulk loads"],
    cons: ["Slowest SLA (3-7 day minimum)", "Not suitable for urgent shipments"],
    services: [
      { name: "Sea Express", sla: "3-5 day", costPerKg: 45, zones: ["India Metro", "India Tier-2"], dg: true, maxWeight: 200, desc: "Maersk's coastal fast lane. Containers prioritised at port for 3-5 day delivery. DG certified across all hazmat classes. Best value for heavy DG freight that isn't time-critical." },
      { name: "Ocean Freight", sla: "5-7 day", costPerKg: 20, zones: ["India Metro", "India Tier-2", "India Rural"], dg: true, maxWeight: 1000, desc: "Full container load via coastal shipping lanes. ₹20/kg is practically free at scale. DG certified, Rural-capable via inland depots. The move for anything measured in tonnes." },
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
  reliabilityFail: -25,     // Delivery failed due to carrier unreliability
  expiredOrder: -25,        // Order expired without being dispatched
};

// ── Player start ────────────────────────────────────────────────────────────
export const INITIAL_PLAYER = {
  money: 25000,       // ₹25,000 starting budget
  totalShipments: 25,
  xp: 0,
  points: 0,
};

// ── Win / Lose ──────────────────────────────────────────────────────────────
// NOTE: Failed/expired shipments no longer end the game — they deduct points instead.
export const LOSE_CONDITIONS = { minFunds: 0 };

// ── Time pressure ───────────────────────────────────────────────────────────
export const ORDER_EXPIRY_MINUTES = 180;  // 3 in-game hours to assign

// ── Game clock ──────────────────────────────────────────────────────────────
// Day = 09:00–17:00 (480 in-game minutes).
// At 1×: 625 ms/tick, 1 min/tick → 480 ticks × 0.625 s = 300 s = 5 real minutes.
// Every single minute is displayed; no decimal jumping.
export const TICK_INTERVAL_MS = 625;
export const MINUTES_PER_TICK = 1;

export const SPEED_OPTIONS = [
  { label: "1×", multiplier: 1, interval: 625 },
  { label: "2×", multiplier: 2, interval: 312 },
  { label: "3×", multiplier: 3, interval: 208 },
  { label: "4×", multiplier: 4, interval: 156 },
  { label: "5×", multiplier: 5, interval: 125 },
];

// ── Warehouse / Dashboard hours ─────────────────────────────────────────────
export const WAREHOUSE = {
  openHour: 9,
  closeHour: 17,
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
