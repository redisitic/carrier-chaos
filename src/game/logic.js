import {
  STORES,
  ZONES,
  ZONE_DISTANCE,
  SLA_HOURS,
  DEADLINES,
  SCORE,
  WAREHOUSE,
  RUSH_HOURS,
  RUSH_MULTIPLIER,
  ORDER_EXPIRY_MINUTES,
  XP_LEVELS,
} from "./constants";
import { getAllCarriers } from "../hooks/useCustomCarriers";
import { getWeatherMultiplier } from "./weather";

// ── Utilities ─────────────────────────────────────────────────────────────────

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randFloat(min, max) {
  return min + Math.random() * (max - min);
}

export function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Converts a total number of game minutes into a formatted "Shift X, HH:MM" string.
 */
export function formatDeliveryDate(minutes) {
  const shiftLengthMinutes = 8 * 60; // 09:00–17:00 = 480 min
  const shiftStartMinutes = 9 * 60;  // shifts start at 09:00
  // Each shift starts at 09:00; compute which shift number and offset within it
  const offsetFromFirst = minutes - shiftStartMinutes;
  const s = Math.max(1, Math.floor(offsetFromFirst / shiftLengthMinutes) + 1);
  const withinShift = ((minutes - shiftStartMinutes) % shiftLengthMinutes + shiftLengthMinutes) % shiftLengthMinutes;
  const h = Math.floor(withinShift / 60) + 9; // 09:00 base
  const m = Math.floor(withinShift % 60);

  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");

  return `Shift ${s}, ${hh}:${mm}`;
}

// ── Order generation ──────────────────────────────────────────────────────────

let _orderId = 1000;

// ── Product catalogue (80 products, randomly assigned per order) ──────────────
const PRODUCTS = [
  "Lego Cat", "Wireless Earbuds", "Standing Desk", "Mechanical Keyboard",
  "Yoga Mat", "Electric Kettle", "Air Purifier", "Bamboo Cutting Board",
  "Portable Monitor", "Laptop Stand", "Smart Bulb Pack", "Protein Powder (5kg)",
  "Running Shoes", "Dumbbell Set", "Coffee Grinder", "Cast Iron Skillet",
  "Instant Pot", "Resistance Bands", "Kindle Paperwhite", "Ring Light",
  "Webcam HD 4K", "USB-C Hub", "SSD 1TB", "Gaming Headset",
  "Noise-Cancelling Headphones", "Smartwatch", "Blender Pro", "Air Fryer XL",
  "Espresso Machine", "Hand Mixer", "Digital Scale", "Massage Gun",
  "Phone Tripod", "Action Camera", "Walkie Talkies", "LED Strip Lights",
  "Thermal Flask", "Trekking Poles", "Camping Lantern", "Sleeping Bag",
  "Drone Mini", "VR Headset", "Graphics Tablet", "Drawing Glove",
    "Watercolor Set", "Sculpting Clay (Bulk)", "Acrylic Paint Kit", "Fountain Pen Set",
  "Leather Wallet", "Sunglasses UV400", "Compression Socks", "Ankle Brace",
  "First Aid Kit Pro", "Blood Pressure Monitor", "Pulse Oximeter", "Thermometer Gun",
  "Multivitamin Pack", "Omega-3 Capsules", "Whey Protein Isolate", "Eye Drops",
  "Baby Monitor", "Car Seat Cover", "Dash Camera", "Tire Inflator",
  "Jump Starter Kit", "USB Car Charger", "Parking Sensor Kit", "Seat Cushion Gel",
  "Office Chair Mat", "Monitor Arm", "Desk Organiser", "Cable Management Kit",
  "Power Strip Surge", "Smart Plug 4-Pack", "Security Camera", "Door Sensor Kit",
  "Robot Vacuum", "Steam Mop", "Water Filter Pitcher", "Shower Filter", "Thomas and his friends",
  "Harsh"
];

// ── Destination Cities ────────────────────────────────────────────────────────
const CITIES_BY_ZONE = {
  "India Metro": ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata"],
  "India Tier-2": ["Pune", "Ahmedabad", "Surat", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik"],
  "India Rural": ["Lonavala", "Satara", "Jalgaon", "Amravati", "Nanded", "Kolhapur", "Akola", "Latur", "Dhule", "Ahmednagar", "Chandrapur", "Parbhani", "Ichalkaranji", "Jalna", "Bhusawal", "Navi Mumbai", "Panvel", "Kalyan"],
};

export function generateOrder(gameMinutes) {
  const store = randFrom(STORES);
  const zone = randFrom(store.zones);
  const distRange = ZONE_DISTANCE[zone];
  const distance = randInt(distRange.min, distRange.max);
  const weight = parseFloat(randFloat(store.avgWeight.min, store.avgWeight.max).toFixed(1));
  const value = randInt(store.avgValue.min, store.avgValue.max);
  const priority = randFrom(store.priorities);
  const isDG = Math.random() < store.dgChance;
  const isFragile = Math.random() < store.fragileChance;

  // Deadline based on priority
  let deadline;
  if (priority === "Express") {
    deadline = randFrom(["same-day", "next-day"]);
  } else if (priority === "Standard") {
    deadline = randFrom(["next-day", "3-5 day"]);
  } else {
    deadline = randFrom(["3-5 day", "5-7 day"]);
  }

  // Generate flavor text based on properties
  const productName = randFrom(PRODUCTS);
  let desc = `Standard shipment of ${productName}.`;
  
  if (isDG && isFragile) {
    desc = `Hazardous & fragile cargo: ${productName}. Contains sensitive volatile materials (Class 9 Lithium/Chemicals). Requires gentle handling and DG-certified carrier.`;
  } else if (isDG) {
    desc = `Dangerous Goods (DG): ${productName}. Contains restricted materials (batteries, flammables, or chemical compounds). Must ship via DG-certified network.`;
  } else if (isFragile) {
    desc = `Fragile handling required: ${productName}. Sensitive components, requires premium suspension transport. Avoid standard surface freight.`;
  } else if (weight > 30) {
    desc = `Heavy bulk shipment: ${productName}. Weighs ${weight}kg. Will require freight-capable carrier.`;
  } else if (priority === "Express") {
    desc = `Urgent time-critical delivery: ${productName}. Customer has paid premium for expedited routing.`;
  }

  return {
    id: ++_orderId,
    store: store.name,
    storeIcon: store.icon,
    category: store.category,
    productName,
    desc,
    zone,
    city: randFrom(CITIES_BY_ZONE[zone] || ["Unknown City"]),
    distance,
    weight,
    value,
    priority,
    deadline,
    isDG,
    isFragile,
    arrivalMinutes: gameMinutes,
    status: "queued",
    selectedCarrier: null,
    selectedService: null,
    deliveryResult: null,
    trackingEvents: [],
  };
}

export function resetOrderId() {
  _orderId = 1000;
}

// ── Service validation ────────────────────────────────────────────────────────

/**
 * Returns an array of { carrier, service, valid, reasons[] } for every
 * carrier+service combination. `valid` is true if the service can handle the order.
 */
export function getServiceOptions(order) {
  const options = [];
  const CARRIERS = getAllCarriers();

  for (const carrier of CARRIERS) {
    for (const service of carrier.services) {
      const reasons = [];
      let valid = true;

      // Zone check
      if (!service.zones.includes(order.zone)) {
        valid = false;
        reasons.push(`Doesn't serve ${order.zone}`);
      }

      // Weight check
      if (order.weight > service.maxWeight) {
        valid = false;
        reasons.push(`Max weight ${service.maxWeight}kg exceeded`);
      }

      // DG check
      if (order.isDG && !service.dg) {
        valid = false;
        reasons.push("Cannot handle dangerous goods");
      }

      // SLA check — service SLA must meet or beat the order deadline
      const slaHours = SLA_HOURS[service.sla];
      const deadlineHours = SLA_HOURS[order.deadline];
      if (slaHours > deadlineHours) {
        valid = false;
        reasons.push(`SLA ${service.sla} exceeds deadline ${order.deadline}`);
      }

      // Calculate cost
      const cost = Math.round(service.costPerKg * order.weight);

      options.push({
        carrierName: carrier.name,
        carrierIcon: carrier.icon,
        carrierColor: carrier.color,
        reliability: carrier.reliability,
        serviceName: service.name,
        sla: service.sla,
        slaHours,
        cost,
        dg: service.dg,
        maxWeight: service.maxWeight,
        valid,
        reasons,
      });
    }
  }

  return options;
}

/**
 * Get the cheapest valid service cost for an order (used for cost efficiency scoring).
 */
export function getCheapestValidCost(order) {
  const options = getServiceOptions(order);
  const validOpts = options.filter((o) => o.valid);
  if (validOpts.length === 0) return Infinity;
  return Math.min(...validOpts.map((o) => o.cost));
}

// ── Delivery calculation ──────────────────────────────────────────────────────

/**
 * Calculate delivery result when player dispatches with a specific carrier + service.
 * ALL combinations now work — wrong choices apply heavy penalties instead of being blocked.
 */
export function calculateDelivery(order, carrierName, serviceName, gameMinutes, weather) {
  const CARRIERS = getAllCarriers();
  const carrier = CARRIERS.find((c) => c.name === carrierName);
  const service = carrier.services.find((s) => s.name === serviceName);
  const slaHours = SLA_HOURS[service.sla];
  const deadlineHours = SLA_HOURS[order.deadline];

  // ── Mismatch flags ──
  const zoneServed = service.zones.includes(order.zone);
  const weightOk = order.weight <= service.maxWeight;
  const dgCompliant = !order.isDG || service.dg;
  const slaMatch = slaHours <= deadlineHours;

  // ── Duration calculation ──
  let durationHours = slaHours * (0.7 + Math.random() * 0.5); // 70%–120% of SLA

  // Zone mismatch penalty: carrier doesn't normally serve this zone → +50% duration
  if (!zoneServed) {
    durationHours *= 1.5;
  }

  // Weight exceeded penalty: overloaded → +30% duration
  if (!weightOk) {
    durationHours *= 1.3;
  }

  // Weather multiplier
  if (weather) {
    const weatherMult = getWeatherMultiplier(weather, order.zone);
    durationHours *= weatherMult;
  }

  // Reliability check — carrier might fail
  // DG violation: sending DG via non-DG carrier → increased failure chance (+25%)
  let effectiveReliability = carrier.reliability;
  if (!dgCompliant) {
    effectiveReliability = Math.max(0.3, effectiveReliability - 0.25);
  }
  const deliverySuccess = Math.random() < effectiveReliability;

  // Cost
  const cost = Math.round(service.costPerKg * order.weight);

  // ── Scoring ──
  let points = SCORE.successfulDelivery;

  // SLA vs Deadline
  if (slaMatch) {
    points += SCORE.slaMatch;
    if (slaHours < deadlineHours) {
      points += SCORE.speedBonus;
    }
  } else {
    points += SCORE.slaMiss;
  }

  // Cost efficiency
  const cheapest = getCheapestValidCost(order);
  if (cheapest !== Infinity && cost <= cheapest) {
    points += SCORE.costEfficiency;
  } else if (cheapest !== Infinity) {
    points -= Math.round((cost - cheapest) * SCORE.costPenaltyRate);
  }

  // Zone mismatch penalty
  if (!zoneServed) {
    points -= 40;
  }

  // Weight exceeded penalty
  if (!weightOk) {
    points -= 30;
  }

  // DG compliance
  if (!dgCompliant) {
    points += SCORE.dgViolation;
  }

  // Fragile handling
  if (order.isFragile) {
    if (service.sla === "same-day" || service.sla === "next-day") {
      points += SCORE.fragileBonus;
    } else if (service.sla === "5-7 day") {
      points += SCORE.fragilePenalty;
    }
  }

  // Reliability failure
  if (!deliverySuccess) {
    points += SCORE.reliabilityFail;
  }

  const xpGain = Math.max(1, Math.floor(Math.max(0, points) / 8));

  return {
    carrierName,
    serviceName,
    sla: service.sla,
    durationHours: parseFloat(durationHours.toFixed(2)),
    cost,
    points: Math.max(0, points),
    xpGain,
    slaMatch,
    speedBonus: slaHours < deadlineHours,
    costEfficient: cheapest !== Infinity && cost <= cheapest,
    dgCompliant,
    zoneServed,
    weightOk,
    deliverySuccess,
    reliability: carrier.reliability,
  };
}

// ── Order expiry ──────────────────────────────────────────────────────────────

export function isOrderExpired(order, currentMinutes) {
  return (currentMinutes - order.arrivalMinutes) >= ORDER_EXPIRY_MINUTES;
}

export function getExpiryProgress(order, currentMinutes) {
  const elapsed = currentMinutes - order.arrivalMinutes;
  return Math.min(1, elapsed / ORDER_EXPIRY_MINUTES);
}

// ── Dynamic pricing (rush hours) ──────────────────────────────────────────────

export function isRushHour(gameHour) {
  return RUSH_HOURS.some((rh) => gameHour >= rh.start && gameHour < rh.end);
}

export function getRushMultiplier(gameHour) {
  return isRushHour(gameHour) ? RUSH_MULTIPLIER : 1.0;
}

export function getCostTrend(gameHour) {
  if (isRushHour(gameHour)) return "up";
  if (RUSH_HOURS.some((rh) => gameHour >= rh.end && gameHour < rh.end + 1)) return "down";
  return "stable";
}

// ── Warehouse logic ───────────────────────────────────────────────────────────

export function isWarehouseOpen(gameHour) {
  return gameHour >= WAREHOUSE.openHour && gameHour < WAREHOUSE.closeHour;
}

// ── XP level ──────────────────────────────────────────────────────────────────

export function xpLevel(xp) {
  let result = XP_LEVELS[0];
  for (const lvl of XP_LEVELS) {
    if (xp >= lvl.minXp) result = lvl;
  }
  return result;
}

// ── Tracking event generation ─────────────────────────────────────────────────

/**
 * Generate the sequence of tracking events for a delivery based on SLA and zone.
 * Returns array of { code, label, icon, offsetHours } where offsetHours is
 * the delay from dispatch time when that event should fire.
 */
export function generateTrackingTimeline(sla, zone, durationHours) {
  const isInternational = ["EU", "US", "Middle East", "Asia-Pacific"].includes(zone);
  const events = [];
  let t = 0;

  events.push({ code: "CARRIER_ASSIGNED", offsetHours: t });
  t += durationHours * 0.05;

  events.push({ code: "PICKUP_SCHEDULED", offsetHours: t });
  t += durationHours * 0.1;

  events.push({ code: "PICKED_UP", offsetHours: t });
  t += durationHours * 0.15;

  events.push({ code: "IN_TRANSIT", offsetHours: t });
  t += durationHours * 0.2;

  events.push({ code: "AT_HUB", offsetHours: t });

  if (isInternational) {
    t += durationHours * 0.15;
    events.push({ code: "CUSTOMS_CLEARANCE", offsetHours: t });
  }

  t += durationHours * 0.2;
  events.push({ code: "OUT_FOR_DELIVERY", offsetHours: t });

  events.push({ code: "DELIVERED", offsetHours: durationHours });

  return events;
}
